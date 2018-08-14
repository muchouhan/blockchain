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
	    	console.log("Deploy account:"+account);
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
	        
	        App.loadUniversityPersonDocuments();
	    });
	  },
	  
	  
	 loadUniversityHome: function() {
		var entity = sessionStorage.entityAddress;
		var type = sessionStorage.e_type;
	    console.log(type+" entity address:"+entity);
	    
	    if(entity==undefined) return;
		
	    var bgcInstance;
	    
		App.contracts.BGC.deployed().then(function(instance) {
			   bgcInstance = instance;
		
			   return instance.getEntity({
					from: entity,
					gas: 500000
			  });
		}).then(function(result) {
	        console.log("getEntity:"+result);
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
		        console.log("all employee for org are :"+result);
		        $.each(result, function( index, value ){
         	  	console.log("now fetch details for person: "+value);
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
															gender=='M' ?"Male":"Female",
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
		    	console.log("check whether university has any permission to view :" + result);
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
	        	console.log("result:" + result);
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
		    	console.log("check whether university has any permission to view :" + result);
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
	        	console.log("result:" + result);
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
			    	console.log("person has been enrolled in University");
		        }).catch(function(err) {
		            console.error(err);
		        });
				
		 },
	  
		 
		 loadUniversityPersonDocuments: function() {
//				App.buildUniversityPersonDocumentRow("67e014aaf5dca488057592ee47305d9b3e10","Gujrati School","10 Marksheet","Mukund Chouhan","Approved","Approved");
//				App.buildUniversityPersonDocumentRow("46e014aaf5dca488057592ee47305d9b3e10","Gujrati School","12 Marksheet","Mukund Chouhan","Approved","Approved");
//				App.buildUniversityPersonDocumentRow("76e014aaf5dca488057592ee47305d9b3e10","Vikram University","B.Sc. I","Mukund Chouhan","Approved","Approved");
//				App.buildUniversityPersonDocumentRow("Ade014aaf5dca488057592ee47305d9b3e10","Vikram University","B.Sc. II","Mukund Chouhan","Approved","Approved");
//				App.buildUniversityPersonDocumentRow("tut014aaf5dca488057592ee47305d9b3e10","Vikram University","B.Sc. III","Mukund Chouhan","Approved","Approved");
		},
	
		buildUniversityPersonDocumentRow: function(document, issuer, docName,approver,status,comments ) {
			$('table#universityPersonDocuments').dataTable().fnAddData( [ document,
														issuer,
														docName,
														approver,
														status,
														comments,
												        '<button type="button" class="btn btn-xs btn-default" id="'+document+'" onclick="App.downloadUniversityPersonDocument(this)" > <i class="fa">&#xf019;</i> </button>'+
														'<button type="button" class="btn btn-xs btn-default" id="'+document+'" onclick="App.deleteUniversityPersonRow(this)" > <i class="fa fa-trash"></i> </button>'
														]);
		},
		
		downloadUniversityPersonDocument:function(ele){
			console.log("University want to download person document id :"+ele.id);
		},
		
		deleteUniversityPersonRow:function(ele){
			if (confirm("Are you sure you want to delete document.") == true) {
				console.log("deleted record id :"+ele.id);
			}
		},
	 
		addUniversityPersonDocument: function(ele) {
			 $('#addUniversityPersonDocumentPopup').css('display', 'block');	 
		},
		submitUniversityPersonDocument: function(ele) {
			console.log("University want to submit person document id :"+ele.id);
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
                	return instance.updatePerson(fName,occupation,income,dob,gender,rAddress1,rAddress2,mobile,email,country,{
		                from: address,
		                gas: 500000
		          });  	
                }
              
	        }).then(function(result) {
	        	console.log(" receipt:" + result);
	        }).catch(function(err) {
	            console.error(err);
	        });
			
	},

		
		 
		 
		 
		
};
