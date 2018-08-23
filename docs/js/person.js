App = {
	    web3Provider: null,
	    contracts: {},
	    account: "0x0",
	    loading: false,
	
	    init: function() {
	        if (typeof web3 !== 'undefined') {
	            // reuse the provider of the Web3 object injected by Metamask
	            App.web3Provider = web3.currentProvider;
	        } else {
	            // create a new provider and plug it directly into our local node
	            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
	        }
	        web3 = new Web3(App.web3Provider);
	        App.displayAccountInfo();
	        return App.initContract();
	    },
	
	    displayAccountInfo: function() {
	        web3.eth.getCoinbase(function(err, account) {
	            if (err === null) {
//	                console.log("App.account:" + account);
	                App.account = account;
	            }
	        });
	    },
	
	    initContract: function() {
	        $.getJSON('App.json', function(contractArtifect) {
	
	            // get the contract artifact file and use it to instantiate a truffle
	            // contract abstraction
	            App.contracts.BGC = TruffleContract(contractArtifect);
	
	            // set the provider for our contracts
	            App.contracts.BGC.setProvider(App.web3Provider);
	            App.loadPersonHomePage();
	            App.loadPersonAccessPage();
	        });
	    },
	
	    loadPersonHomePage: function() {
	        var user = sessionStorage.user_address;
//	        console.log("user session address:" + user);
	        if (user == undefined) return;
	        var instance;
	        App.contracts.BGC.deployed().then(function(inst) {
	        	instance=inst; 
//	            console.log("fetch employee details from network");
	            return instance.getPerson({
	                from: user,
	                gas: 500000
	            });
	        }).then(function(result) {
//	            console.log("getPerson result:" + result);
	            var fName = web3.toAscii(result[1]).replace(/\u0000/g, '');
	            var occupation = web3.toAscii(result[2]).replace(/\u0000/g, '');
	            var dob = web3.toAscii(result[4]).replace(/\u0000/g, '');
	            var gender = web3.toAscii(result[5]).replace(/\u0000/g, '');
	            var raddress1 = web3.toAscii(result[6]).replace(/\u0000/g, '');
	            var raddress2 = web3.toAscii(result[7]).replace(/\u0000/g, '');
	            var email = web3.toAscii(result[9]).replace(/\u0000/g, '');
	            var country = web3.toAscii(result[10]).replace(/\u0000/g, '');
	            $('#userAddress').val(result[0]);
	            $('#userFullName').val(fName);
	            $('#occupation').val(occupation);
	            $('#income').val(result[3]);
	            $('#dob').val(dob);
	            $('#gender').val(gender);
	            $('#addressLine1').val(raddress1);
	            $('#addressLine2').val(raddress2);
	            $('#mobile').val(result[8]);
	            $('#email').val(email);
	            $('#country').val(country);
	            $('#personPhotoId').attr('src',result[11]);
	            console.log("Document result:" + result[12]);
	            //iterate all document and add in document table 
	            $.each(result[12], function( index, value ){
		            	if(!web3.toBigNumber(value).isZero()) {
		            	    instance.getDocument(value,{
			  	                from: user,
			  	                gas: 500000
					  	    }).then(function(result) {
	//			  	          console.log("Document result:" + result);
				  	          App.buildPersonDocumentRow(web3.toAscii(result[1]).replace(/\u0000/g, ''),
				  	        		  					 web3.toAscii(result[0]).replace(/\u0000/g, ''),
				  	        		  					 web3.toAscii(result[3]).replace(/\u0000/g, ''),
				  	        		  					 web3.toAscii(result[4]).replace(/\u0000/g, ''),
				  	        		  					 result[5],
				  	        		  					 result[6]);
				  	        }).catch(function(err) {
				  	            console.error(err);
				  	        });
		            	}
	            });
	        }).catch(function(err) {
	            console.error(err);
	        });
	    },
	
		buildPersonDocumentRow: function(document, docName,issuer,approver,status,comments ) {
			$('table#personDocuments').dataTable().fnAddData( [ document,
																docName,
																issuer,
																approver,
																App.getStatusLabel(status),
																comments,
														        '<button type="button" class="btn btn-xs btn-default" id="'+document+'" onclick="App.showPersonDocumentPopup(this)" > <i class="fa">&#xf044;</i> </button>'
																]);
		},
		
		getStatusLabel:function(id){
			switch (id.toString()) {
		    case "0":
		        return "Uploaded";
		    case "1":
		    	return "Approved";
		    case "2":
		    	return "Rejected";
		    default:
		    	return "";
			}
		},
		
		showPersonDocumentPopup:function(ele){
				var documentId = ele.id;
				var user = sessionStorage.user_address;
		        if (user == undefined) return;
		        
		        App.contracts.BGC.deployed().then(function(inst) {
		        	instance=inst
		            return instance.getDocument(documentId,{
		                from: user,
		                gas: 500000
		            });
		        }).then(function(result) {
		        	console.log("fetching document details from solidity for documentId:" + result);
		        	var fileName = web3.toAscii(result[1]).replace(/\u0000/g, '');
		        	var ext = web3.toAscii(result[2]).replace(/\u0000/g, '');
		        	var url  = "http://localhost:5000/uploads//"+fileName+"."+ext;
		        	console.log(url);
			        $('#popupUserDocId').val(fileName);
			        $('#popupIssuer').val(web3.toAscii(result[3]).replace(/\u0000/g, ''))
			        $('#popupDocName').val(web3.toAscii(result[0]).replace(/\u0000/g, ''));
			        $('#popupDocStatus').val(result[5].toString());
			        $('#poupDocIssuerComment').val(result[6]);
			        $('#personDocumentPath').attr("href", url).attr("download", "file");
			        
			        $('#personDocumentPopup').css('display', 'block');
		        }).catch(function(err) {
		            console.error(err);
		        });

		        
		},
		
		approvePersonDocument: function() {
			var _doc = $('#popupUserDocId').val();
	        var _comment = $('#poupDocPersonComment').val();
	        
	        var user = sessionStorage.user_address;
	        App.contracts.BGC.deployed().then(function(instance) {
	            return instance.approveDocument(_doc,_comment,{
	                from: user,
	                gas: 500000
	            });
	        }).then(function(result) {
				console.log("Person has approved ");
				location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });	

	        
		},
		rejectPersonDocument: function() {
			var _doc = $('#popupUserDocId').val();
	        var _comment = $('#poupDocPersonComment').val();
	        
	        var user = sessionStorage.user_address;
	        App.contracts.BGC.deployed().then(function(instance) {
	            return instance.rejectDocument(_doc,_comment,{
	                from: user,
	                gas: 500000
	            });
	        }).then(function(result) {
				console.log("Person has Rejected ");
				location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });	

		},
		
		loadPersonAccessPage: function() {
			var user = sessionStorage.user_address;
			var instance;
	        App.contracts.BGC.deployed().then(function(inst) {
	        	instance=inst
	            return instance.personProfileRequests({
	                from: user,
	                gas: 500000
	            });
	        }).then(function(result) {
	            $.each(result, function( index, value ){
		            	instance.profileRequestDetails(value,{
			  	                from: user,
			  	                gas: 500000
				  	    }).then(function(result) {
			  	            App.buildPersonAccessRow(result[0],result[1],result[2], result[6],result[7],result[8]);
			  	        }).catch(function(err) {
			  	        	console.info("entity is empty "+value);
			  	            console.error(err);
			  	        });	
	            });
	            
	        }).catch(function(err) {
	            console.error(err);
	        });	
	        
		},
	
		buildPersonAccessRow: function(addrs, name, type,canView,canModify,canModifyDocument ) {
					$('table#personAccessRequest').dataTable().fnAddData( [ addrs,
																web3.toAscii(name).replace(/\u0000/g, ''),
																type==0 ?"University":"Organisation",
																'<input id="'+addrs+'_view" type="checkbox" '+ (canView ? "checked":"") +' />',
																'<input id="'+addrs+'_modify" type="checkbox" '+ (canModify ? "checked":"") +' />',
																'<input id="'+addrs+'_document" type="checkbox" '+ (canModifyDocument ? "checked":"") +' />',
														        '<button type="button" class="btn btn-xs btn-default" id="'+addrs+'" onclick="App.savePersonAccessRow(this)" > <i class="fa">&#xf0c7;</i> </button>'+ 
																'<button type="button" class="btn btn-xs btn-default" id="'+addrs+'" onclick="App.deletePersonAccessRow(this)" > <i class="fa fa-trash"></i> </button>'
																]);
		},
	
		
		savePersonAccessRow:function(ele){
			if (confirm("Are you sure you want to update permission.") == true) {
				var canView=$('#'+ele.id+"_view").is(":checked");
				var canModify=$('#'+ele.id+"_modify").is(":checked");
				var canModifyDocument=$('#'+ele.id+"_document").is(":checked");
				
				
				var user = sessionStorage.user_address;
				var instance;
		        App.contracts.BGC.deployed().then(function(inst) {
		        	instance=inst;
//					console.log("canView:"+canView+"\t canModify:"+canModify+"\tcanModifyDocument:"+canModifyDocument);
		            return instance.updateProfileRequest(ele.id,canView,canModify,canModifyDocument,{
		                from: user,
		                gas: 500000
		            });
		        }).then(function(result) {
		        	location.reload();
//		            console.log("updateProfileRequest result:" + result);
		        }).catch(function(err) {
		            console.error(err);
		        });

			}
			
		},
		
		deletePersonAccessRow:function(ele){
			if (confirm("Are you sure you want to update permission.") == true) {
				var user = sessionStorage.user_address;
				var instance;
		        App.contracts.BGC.deployed().then(function(inst) {
		        	instance=inst;
//		        	console.log("deleted record id :"+ele.id);
		            return instance.deleteProfileRequest(ele.id,{
		                from: user,
		                gas: 500000
		            });
		        }).then(function(result) {
//		            console.log("deleteProfileRequest result:" + result);
		        }).catch(function(err) {
		            console.error(err);
		        });

				
			}
		},

};