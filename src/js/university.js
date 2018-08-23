App = {
	  web3Provider: null,
	  contracts: {},
	  account: "0x0",
	  loading: false, 
	 
	  init: function() {
	    // initialize web3
	    if(typeof web3 !== 'undefined') {
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
	      if(err === null) {
//	    	console.log("Deploy account:"+account);
	        App.account = account;
	      }
	    });
	  },
	
	  initContract: function() {
	    $.getJSON('App.json', function(contractArtifect) {
	        App.contracts.BGC = TruffleContract(contractArtifect);
	  	    // set the provider for our contracts
	        App.contracts.BGC.setProvider(App.web3Provider);
	        App.loadUniversityHome();
	        App.loadUniversitySearchPage();
	    });
	  },
	  
	  
	 loadUniversityHome: function() {
		var entity = sessionStorage.entityAddress;
		var type = sessionStorage.e_type;
//	    console.log(type+" entity address:"+entity);
	    
	    if(entity==undefined) return;
		
	    var bgcInstance;
	    
		App.contracts.BGC.deployed().then(function(instance) {
			   bgcInstance = instance;
		
			   return instance.getEntity({
					from: entity,
					gas: 500000
			  });
		}).then(function(result) {
//	        console.log("getEntity:"+result);
	        var name =web3.toAscii(result[1]).replace(/\u0000/g, '');
	        var regNo =web3.toAscii(result[2]).replace(/\u0000/g, '');
	        var etype = result[3];
	        var count =result[4];
	        
	        $('#universityName').text(name);
	        $('#universityRegNo').text(regNo);
	        $('#universityPersonCount').text(count);
	        
	    }).catch(function(err) {
			  console.error(err);
		});
		
	 },
	 
	//function to execute on Sign up
	 loadUniversitySearchPage: function() {
		 var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
	 		
		    if(entity==undefined) return;
			
		    var instance;
		    
			App.contracts.BGC.deployed().then(function(inst) {
			   instance = inst;
			   return instance.enrollment({
					from: entity,
					gas: 500000
			  });
			}).then(function(result) {
//		        console.log("all employee for org are :"+result);
		        $.each(result, function( index, value ){
//         	  	console.log("now fetch details for person: "+value);
	            	instance.getPerson({
		  	                from: value,
		  	                gas: 500000
			  	    }).then(function(result) {
		  	            App.buildUniversityPersonRow(result[0],web3.toAscii(result[1]).replace(/\u0000/g, ''),web3.toAscii(result[5]).replace(/\u0000/g, ''),web3.toAscii(result[9]).replace(/\u0000/g, ''),result[6],result[7],result[8]);
		  	        }).catch(function(err) {
		  	            console.error(err);
		  	        });
		        });
		    }).catch(function(err) {
				  console.error(err);
			});
		
	 },
	 
		 buildUniversityPersonRow: function(addrs, name, gender,email,canView,canModify,canModifyDocument ) {
				$('table#universityPersons').dataTable().fnAddData( [ addrs,
															name,
															gender.toUpperCase()=='M' ?"Male":"Female",
															email,
															'<button type="button" class="btn btn-xs btn-default " id="'+addrs+'" onclick="App.deleteUniversityPersonRow(this)" > <i class="fa fa-trash"></i> </button>'
															
															]);
				
		 },
	
	  deleteUniversityPersonRow:function(ele){
			if (confirm("Are you sure you want to delete person.") == true) {
				console.log("deleted record id :"+ele.id);
			}
	  },
	  
	  universityPersonSearchForUpdate: function()  {
		  	var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			var instance;
			var address = $('#updateUniversityPersonAddress').val();
			
			App.contracts.BGC.deployed().then(function(inst) {
				 instance = inst;
	            return instance.isPersonExist({
	                from: address,
	                gas: 500000
	            });
	        }).then(function(result) {
	        	if(!result){
	        		return new Promise(function(resolve, reject) {
	                    reject(new Error('Given person address does not exist in network!'));
	                });
	        	}
	        	return instance.profileRequestDetails(entity,{
	                from: address,
	                gas: 500000
	            });
		    }).then(function(result) {
//		    	console.log("check whether university has any permission to view :" + result);
              if(!result[7]){
              	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
      	            window.location = './university.html?#toupdate';
      	            return new Promise(function(resolve, reject) {
		                    reject(new Error('University cancel to view Person details!'));
		                });
      	        }else{
      	        	instance.addProfileRequest(address,false,false,false,{
			                from: entity,
			                gas: 500000
			           });	
      	           return new Promise(function(resolve, reject) {
		                    reject(new Error('Request has been sent to view profile!'));
		               });
      	        }
              }
		    }).then(function(result) {
          	return instance.getPerson({
	                from: address,
	                gas: 500000
	            });  	
	        }).then(function(result) {
//	        	console.log("result:" + result);
	            var fName = web3.toAscii(result[1]).replace(/\u0000/g, '');
	            var occupation = web3.toAscii(result[2]).replace(/\u0000/g, '');
	            var dob = web3.toAscii(result[4]).replace(/\u0000/g, '');
	            var gender = web3.toAscii(result[5]).replace(/\u0000/g, '');
	            var raddress1 = web3.toAscii(result[6]).replace(/\u0000/g, '');
	            var raddress2 = web3.toAscii(result[7]).replace(/\u0000/g, '');
	            var email = web3.toAscii(result[9]).replace(/\u0000/g, '');
	            var country = web3.toAscii(result[10]).replace(/\u0000/g, '');
	            $('#updateUniversityPersonFullName').val(fName);
	            $('#updateUniversityPersonOccupation').val(occupation);
	            $('#updateUniversityPersonIncome').val(result[3]);
	            $('#updateUniversityPersonDob').val(dob);
	            $('#updateUniversityPersonGender').val(gender);
	            $('#updateUniversityPersonAddressLine1').val(raddress1);
	            $('#updateUniversityPersonAddressLine2').val(raddress2);
	            $('#updateUniversityPersonMobile').val(result[8]);
	            $('#updateUniversityPersonEmail').val(email);
	            $('#updateUniversityPersonCountry').val(country);
	            $('#updateUniversityPersonPhotoId').attr('src',result[11]);
	            
	            
	            $.each(result[12], function( index, value ){
	            	if(!web3.toBigNumber(value).isZero()) {
		            	instance.getDocument(value,{
		  	                from: address,
		  	                gas: 500000
				  	    }).then(function(result) {
//			  	          console.log("Document result:" + result);
			  	          App.buildUniversityPersonDocumentRow(web3.toAscii(result[1]).replace(/\u0000/g, ''),
			  	        		  					 web3.toAscii(result[0]).replace(/\u0000/g, ''),
			  	        		  					 web3.toAscii(result[2]).replace(/\u0000/g, ''),
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
	  
	  universityPersonSearch: function() {
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			var instance;
			var address = $('#universityPersonAddress').val();
			App.contracts.BGC.deployed().then(function(inst) {
				 instance = inst;
	            return instance.isPersonExist({
	                from: address,
	                gas: 500000
	            });
	        }).then(function(result) {
	        	if(!result){
	        		return new Promise(function(resolve, reject) {
	                    reject(new Error('Given person address does not exist in network!'));
	                });
	        	}
	        	return instance.profileRequestDetails(entity,{
	                from: address,
	                gas: 500000
	            });
		    }).then(function(result) {
//		    	console.log("check whether university has any permission to view :" + result);
                if(!result[7]){
                	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
        	            window.location = './university.html?#toupdate';
        	            return new Promise(function(resolve, reject) {
		                    reject(new Error('University cancel to view Person details!'));
		                });
        	        }else{
        	        	instance.addProfileRequest(address,false,false,false,{
			                from: entity,
			                gas: 500000
			           });	
        	           return new Promise(function(resolve, reject) {
		                    reject(new Error('Request has been sent to view profile!'));
		               });
        	        }
                }
		    }).then(function(result) {
            	return instance.getPerson({
	                from: address,
	                gas: 500000
	            });  	
	        }).then(function(result) {
//	        	console.log("result:" + result);
	            var fName = web3.toAscii(result[1]).replace(/\u0000/g, '');
	            var occupation = web3.toAscii(result[2]).replace(/\u0000/g, '');
	            var dob = web3.toAscii(result[4]).replace(/\u0000/g, '');
	            var gender = web3.toAscii(result[5]).replace(/\u0000/g, '');
	            var raddress1 = web3.toAscii(result[6]).replace(/\u0000/g, '');
	            var raddress2 = web3.toAscii(result[7]).replace(/\u0000/g, '');
	            var email = web3.toAscii(result[9]).replace(/\u0000/g, '');
	            var country = web3.toAscii(result[10]).replace(/\u0000/g, '');
	            $('#universityPersonFullname').val(fName);
	            $('#universityPersonOccupation').val(occupation);
	            $('#universityPersonIncome').val(result[3]);
	            $('#universityPersonDob').val(dob);
	            $('#universityPersonGender').val(gender);
	            $('#universityPersonAddressLine1').val(raddress1);
	            $('#universityPersonAddressLine2').val(raddress2);
	            $('#universityPersonMobile').val(result[8]);
	            $('#universityPersonEmail').val(email);
	            $('#universityPersonCountry').val(country);	      
	        }).catch(function(err) {
	            console.error(err);
	        });
						
		 },
		 
		 universityPersonEnroll: function() {
			 var entity = sessionStorage.entityAddress;
				var type = sessionStorage.e_type;
				var instance;
				var address = $('#universityPersonAddress').val();
				
				App.contracts.BGC.deployed().then(function(inst) {
					 instance = inst;
		              return instance.enrollPerson(address,{
			                from: entity,
			                gas: 500000
			          });
			    }).then(function(result) {
//			    	console.log("person has been enrolled in University");
			    	location.reload();
		        }).catch(function(err) {
		            console.error(err);
		        });
				
		 },
	  
		buildUniversityPersonDocumentRow: function(document, docName,docExt,issuer,approver,status,comments) {
			$('table#universityPersonDocuments').dataTable().fnAddData( [  document,
																							docName,
																							issuer,
																							approver,
																							status,
																							comments,
																							'<a class="btn btn-xs btn-default command-delete" download="'+docName+'" href="http://localhost:5000/uploads//'+document+"."+docExt+'">'+
																							'<i class="fa" style="cursor: pointer; font-size: 12px;  padding: 0; margin-bottom: 0px; width: 15px; height: 15px;">&#xf019;</i>'+
																							'</a>'+
																							'<button type="button" class="btn btn-xs btn-default command-delete" id="'+document+'" onclick="App.deleteUniversityPersonRow(this)" > <i class="fa fa-trash"></i> </button>'
																							]);
		},

		deleteUniversityPersonRow:function(ele){
			if (confirm("Are you sure you want to delete document.") == true) {
//				console.log("deleted record id :"+ele.id);
				var entity = sessionStorage.entityAddress;
				var type = sessionStorage.e_type;
				var instance;
				var address = $('#updateUniversityPersonAddress').val();
				
				App.contracts.BGC.deployed().then(function(inst) {
					 instance = inst;
		              return instance.removeDocument(ele.id,address,{
			                from: entity,
			                gas: 500000
			          });
			    }).then(function(result) {
			    	alert("Document has been deleted by university receipt:"+result);
			    	location.reload();
		        }).catch(function(err) {
		            console.error(err);
		        });
			}
		},
	 
		addUniversityPersonDocument: function(ele) {
			var _recipient = $('#updateUniversityPersonAddress').val();
			$('#userDocAddressId').val(_recipient);
			
			$('#addUniversityPersonDocumentPopup').css('display', 'block');	 
		},
		
		uploadPersonDocument:function(){
        	var entity = sessionStorage.entityAddress;
		    
			if(entity==undefined) {
				console.log("Login Organisation details not found ");
				return;
			}
		
        	var _recipient = $('#userDocAddressId').val();
			var _document = $('#userDocId').val();
			var _ext = $('#userDocExt').val();
			var _name = $('#userDocName').val();
			var _comment = $('#userDocComment').val();
			
			App.contracts.BGC.deployed().then(function(inst) {
				 instance = inst;
	            return instance.isPersonExist({
	                from: _recipient,
	                gas: 500000
	            });
	        }).then(function(result) {
	        	if(!result){
	        		return new Promise(function(resolve, reject) {
	                    reject(new Error('Given person address does not exist in network!'));
	                });
	        	}
	        	return instance.isEntityExist({
	                from: entity,
	                gas: 500000
	            });
		    }).then(function(result) {
		    	if(!result){
	        		return new Promise(function(resolve, reject) {
	                    reject(new Error('Given University address does not exist in network!'));
	                });
	        	}
		    	
		    	return instance.issueDocument(_document, _ext,_recipient, _name,_comment,{
	                from: entity,
	                gas: 500000
	            });
		    }).then(function(result) {
		    	console.log("Document uploaded:" + result);
		    	location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });
		},

		
		
		updateUniversityPersonDetails:function(){
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
		    
			if(entity==undefined) {
				console.log("Login University details not found ");
				return;
			}
			
			var fName = $('#updateUniversityPersonFullName').val();
			var occupation = $('#updateUniversityPersonOccupation').val();
			var income = $('#updateUniversityPersonIncome').val();
			var dob = $('#updateUniversityPersonDob').val();
			var gender = $('#updateUniversityPersonGender').val();
			var rAddress1 = $('#updateUniversityPersonAddressLine1').val();
			var rAddress2 = $('#updateUniversityPersonAddressLine2').val();
			var mobile = $('#updateUniversityPersonMobile').val();
			var email = $('#updateUniversityPersonEmail').val();
			var country = $('#updateUniversityPersonCountry').val();
			var address = $('#updateUniversityPersonAddress').val();
			var photo= $('#updateUniversityPersonPhotoId').attr('src');
			console.log("university want to update person info for:"+address);
			var instance;
			App.contracts.BGC.deployed().then(function(inst) {
				instance = inst;
	            return instance.isPersonExist({
	                from: address,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("isPersonExist:" + result);
                if(!result){
		            return new Promise(function(resolve, reject) {
	                    reject(new Error('Given Person address does not exist in network!'));
	                });
                }
                return instance.profileRequestDetails(entity,{
	                from: address,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("check whether University has any permission to view :" + result);
                if(!result[7]){
                	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
        	            window.location = './university.html?#toupdate';
        	            return new Promise(function(resolve, reject) {
		                    reject(new Error('University cancel to view Person details!'));
		                });
        	        }else{
        	        	return instance.addProfileRequest(address,true,true,false,{
			                from: entity,
			                gas: 500000
			          });	
        	        }
                }else{
                	return instance.updatePerson(fName,occupation,income,dob,gender,rAddress1,rAddress2,mobile,email,country,photo,{
		                from: address,
		                gas: 500000
		          });  	
                }
              
	        }).then(function(result) {
	        	console.log(" receipt:" + result);
	        	location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });
			
	},

		
	changeProfilePhoto: function (event) {
		
		// Get form
	    var form = $('#profileUploader')[0];

		// Create an FormData object 
	    var formData = new FormData(form);
	    formData.append('photos[]', event.target.files[0], event.target.files[0].name);
		
	    $.ajax({
	        url: 'http://localhost:5000/upload_photos',
	        method: 'post',
	        data: formData,
	        processData: false,
	        contentType: false,
	        xhr: function () {
	            var xhr = new XMLHttpRequest();
	            return xhr;
	        }
	    }).done(function (data){
	    	 if (data.length > 0) {
	    	        var img = data[0];
	    	        console.log(img);
	    	        if (img.status) {
	    	        	var path = "http://localhost:5000/"+img.publicPath;
	    	        	$('#updateUniversityPersonPhotoId').attr("src", path);
	    	        	console.log("img:"+path);
		    	    }
	    	 } else {
    	        alert('No images were uploaded.')
    	     }
	    }).fail(function (xhr, status) {
	        alert(status);
	    });
	}
		 
		 
		 
		
};
