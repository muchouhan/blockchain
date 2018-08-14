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
	                console.log("App.account:" + account);
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
	            App.loadPersonHomeDocuments();
	            App.loadPersonAccessPage();
	        });
	    },
	
	    loadPersonHomePage: function() {
	        var user = sessionStorage.user_address;
	        console.log("user session address:" + user);
	        if (user == undefined) return;
	        App.contracts.BGC.deployed().then(function(instance) {
	            console.log("fetch employee details from network");
	            return instance.getPerson({
	                from: user,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("getPerson result:" + result);
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
	            console.log("Document IDs:"+result[13]);
	            //iterate all document and add in document table 
	            $.each(result[13], function( index, value ){
	            	  console.log("fetch person documents from solidity : "+value);
	            	  
            	});
	//            $('#personPhotoId')
	            //result[13] would contain list of document id
	
	        }).catch(function(err) {
	            console.error(err);
	        });
	    },
	
	    loadPersonHomeDocuments: function() {
	        var user = sessionStorage.user_address;
	        console.log("fetching user documents from solidiy for address:" + user);
	
//			App.buildPersonDocumentRow("67e014aaf5dca488057592ee47305d9b3e10","Gujrati School","10 Marksheet","Mukund Chouhan","Approved","Approved");
//			App.buildPersonDocumentRow("46e014aaf5dca488057592ee47305d9b3e10","Gujrati School","12 Marksheet","Mukund Chouhan","Approved","Approved");
//			App.buildPersonDocumentRow("76e014aaf5dca488057592ee47305d9b3e10","Vikram University","B.Sc. I","Mukund Chouhan","Approved","Approved");
//			App.buildPersonDocumentRow("Ade014aaf5dca488057592ee47305d9b3e10","Vikram University","B.Sc. II","Mukund Chouhan","Approved","Approved");
//			App.buildPersonDocumentRow("tut014aaf5dca488057592ee47305d9b3e10","Vikram University","B.Sc. III","Mukund Chouhan","Approved","Approved");
		},
	
		buildPersonDocumentRow: function(document, issuer, docName,approver,status,comments ) {
			$('table#personDocuments').dataTable().fnAddData( [ document,
														issuer,
														docName,
														approver,
														status,
														comments,
												        '<button type="button" class="btn btn-xs btn-default" id="'+document+'" onclick="App.showPersonDocumentPopup(this)" > <i class="fa">&#xf044;</i> </button>'
														]);
		},
		
		showPersonDocumentPopup:function(ele){
			var documentId = ele.id;
	        console.log("fetching document details from solidity for documentId:" + documentId);
	        $('#popupUserDocId');
	        $('#popupIssuer')
	        $('#popupDocName')
	        $('#popupDocStatus')
	        $('#poupDocIssuerComment')
	        $('#poupDocPersonComment')
	        $('#personDocumentPopup').css('display', 'block');
		
		},
		
		downloadPersonDocument: function() {
			console.log("Person has downloaded documentId:");
		},
		approvePersonDocument: function() {
			console.log("Person has approved documentId:");
		},
		rejectPersonDocument: function() {
			console.log("Person has rejected documentId:");
		},
		
		
		
		loadPersonAccessPage: function() {
			var user = sessionStorage.user_address;
			var instance;
	        App.contracts.BGC.deployed().then(function(inst) {
	        	instance=inst
	        	console.log("fetching user profiles access details from solidity for address:" + user);
	            return instance.personProfileRequests({
	                from: user,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("profileRequests result:" + result);
	            $.each(result, function( index, value ){
	            	  	console.log("now fetch details for entity: "+value);
		            	instance.profileRequestDetails(value,{
			  	                from: user,
			  	                gas: 500000
				  	    }).then(function(result) {
			  	            console.log("profileRequests result:" + result);
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
					console.log("canView:"+canView+"\t canModify:"+canModify+"\tcanModifyDocument:"+canModifyDocument);
		            return instance.updateProfileRequest(ele.id,canView,canModify,canModifyDocument,{
		                from: user,
		                gas: 500000
		            });
		        }).then(function(result) {
		            console.log("updateProfileRequest result:" + result);
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
		        	console.log("deleted record id :"+ele.id);
		            return instance.deleteProfileRequest(ele.id,{
		                from: user,
		                gas: 500000
		            });
		        }).then(function(result) {
		            console.log("deleteProfileRequest result:" + result);
		        }).catch(function(err) {
		            console.error(err);
		        });

				
			}
		},
		

};