App = {
	  web3Provider: null,
	  contracts: {},
	  account: "0x0",
	  loading: false, 
	  
	 
	  init: function() {
//		  const express = require('express');
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
//		    	console.log("Deploy account:"+account);
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
		        App.loadOrganisationHomePage();
		        
		        App.loadOrganisationSearchPage();
		        App.requestForVerification();
		        App.thirdPartyVerifiedRequests();
		    });
	  },
		  
		  
	  loadOrganisationHomePage: function() {
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
//		    console.log(type+" entity address:"+entity);
		    
		    if(entity==undefined) return;
			
		    var bgcInstance;
		    
			App.contracts.BGC.deployed().then(function(instance) {
				   bgcInstance = instance;
			
				   return instance.getEntity({
						from: entity,
						gas: 500000
				  });
			}).then(function(result) {
//		        console.log("getEntity:"+result);
		        var name = web3.toAscii(result[1]).replace(/\u0000/g, '');
		        var regNo = web3.toAscii(result[2]).replace(/\u0000/g, '');
		        var etype = result[3];
		        var count =result[4];
		        
		        $('#organisationName').text(name);
		        $('#organisationRegNo').text(regNo);
		        $('#organisationPersonCount').text(count);
		        
		    }).catch(function(err) {
				  console.error(err);
			});
			
	  },
		 
	  loadOrganisationSearchPage: function() {
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
//            	  	console.log("now fetch details for person: "+value);
	            	instance.getPerson({
		  	                from: value,
		  	                gas: 500000
			  	    }).then(function(result) {
		  	            App.buildOrganisationPersonRow(result[0],web3.toAscii(result[1]).replace(/\u0000/g, ''),web3.toAscii(result[5]).replace(/\u0000/g, ''),web3.toAscii(result[9]).replace(/\u0000/g, ''),result[6],result[7],result[8]);
		  	        }).catch(function(err) {
		  	            console.error(err);
		  	        });	
		        });
		    }).catch(function(err) {
				  console.error(err);
			});
			
		},
		 
		buildOrganisationPersonRow: function(addrs, name, gender,email,canView,canModify,canModifyDocument ) {
				$('table#organisationPersons').dataTable().fnAddData( [ addrs,
															name,
															gender==('F'||'f') ?"Female":"Male",
															email,
															'<button type="button" class="btn btn-xs btn-default" id="'+addrs+'" onclick="App.deleteOrganisationPersonRow(this)" > <i class="fa fa-trash"></i> </button>'
															]);
				
		},  
			
		deleteOrganisationPersonRow:function(ele){
				if (confirm("Are you sure you want to delete person.") == true) {
					console.log("deleted record id :"+ele.id);
				}
		},
		  
		requestForVerification: function() {
				var entity = sessionStorage.entityAddress;
				var type = sessionStorage.e_type;
		 		
			    if(entity==undefined) return;
				
			    var instance;
			    
				App.contracts.BGC.deployed().then(function(inst) {
				   instance = inst;
				   return instance.personVerificationRequestForMe({
						from: entity,
						gas: 500000
				  });
				}).then(function(result) {
//					console.log("all ids for org are :"+result);
			        $.each(result, function( index, value ){
//	            	  	console.log("now fetch details for person: "+value.toNumber());
		            	instance.personVerificationDetails(value.toNumber(),{
			  	                from: entity,
			  	                gas: 500000
				  	    }).then(function(result) {
//				  	    	console.log("requestForVerification id :"+value+" details are : "+result);
				  	    	if(!web3.toBigNumber(value.toNumber()).isZero()) App.buildRequestForVerificationRow(result[0],web3.toAscii(result[1]).replace(/\u0000/g, ''),web3.toAscii(result[2]).replace(/\u0000/g, ''),web3.toAscii(result[3]).replace(/\u0000/g, ''),web3.toAscii(result[5]).replace(/\u0000/g, ''));
			  	        }).catch(function(err) {
			  	            console.error(err);
			  	        });	
			        });
			    }).catch(function(err) {
					  console.error(err);
				});
				
		},
		
		buildRequestForVerificationRow: function(personAddrs, personName, gender,email,requester ) {
			$('table#personVerificationRequestForMe').dataTable().fnAddData( [ personAddrs,
															  personName,
															  gender==('F'||'f') ?"Female":"Male",
															  email,
															  requester,
												        '<button type="button" class="btn btn-xs btn-default" id="'+personAddrs+'" onclick="App.fetchPersonDetailsForVerification(this)" > <i class="fa">&#xf1d9;</i> </button>'
														]);
			
		},
		
		fetchPersonDetailsForVerification:function(ele){
			
			
		    var instance;
		    
			App.contracts.BGC.deployed().then(function(inst) {
			   instance = inst;
			   return instance.getPerson({
					from: ele.id,
					gas: 500000
			  });
			}).then(function(result) {
//				console.log("Person detials from popup :"+result);
				var fName = web3.toAscii(result[1]).replace(/\u0000/g, '');
	            var occupation = web3.toAscii(result[2]).replace(/\u0000/g, '');
	            var dob = web3.toAscii(result[4]).replace(/\u0000/g, '');
	            var gender = web3.toAscii(result[5]).replace(/\u0000/g, '');
	            var raddress1 = web3.toAscii(result[6]).replace(/\u0000/g, '');
	            var raddress2 = web3.toAscii(result[7]).replace(/\u0000/g, '');
	            var email = web3.toAscii(result[9]).replace(/\u0000/g, '');
	            var country = web3.toAscii(result[10]).replace(/\u0000/g, '');
	            $('#personDetailsForVerificationPopupUserAddress').val(result[0]);
	            $('#personDetailsForVerificationPopupFullName').val(fName);
	            $('#personDetailsForVerificationPopupOccupation').val(occupation);
	            $('#personDetailsForVerificationPopupIncome').val(result[3]);
	            $('#personDetailsForVerificationPopupDob').val(dob);
	            $('#personDetailsForVerificationPopupGender').val(gender);
	            $('#personDetailsForVerificationPopupAddressLine1').val(raddress1);
	            $('#personDetailsForVerificationPopupAddressLine2').val(raddress2);
	            $('#personDetailsForVerificationPopupMobile').val(result[8]);
	            $('#personDetailsForVerificationPopupEmail').val(email);
	            $('#personDetailsForVerificationPopupCountry').val(country);
	            $('#personForVerificationPopupPersonPhotoId').attr('src',result[11]);
	            var table = $('#personDetailsForVerificationPopupDocuments').DataTable();
	            table.clear().draw();
	            
	            $.each(result[12], function( index, value ){
	            	if(!web3.toBigNumber(value).isZero()) {
		            	instance.getDocument(value,{
		  	                from: ele.id,
		  	                gas: 500000
				  	    }).then(function(result) {
//			  	          console.log("Document result:" + result);
			  	          App.buildPersonDocumentForVerificationRow(web3.toAscii(result[1]).replace(/\u0000/g, ''),
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

				$('#fetchPersonDetailsForVerificationPopup').css('display', 'block');    
				
		    }).catch(function(err) {
				  console.error(err);
			});
		},
		
		buildPersonDocumentForVerificationRow: function(document, docName,docExt,issuer,approver,status,comments) {
			$('table#personDetailsForVerificationPopupDocuments').dataTable().fnAddData( [  document,
																							docName,
																							issuer,
																							approver,
																							App.getStatusLabel(status),
																							comments,
																							'<a class="btn btn-xs btn-default command-delete" download="'+docName+'" href="http://localhost:5000/uploads//'+document+"."+docExt+'">'+
																							'<i class="fa" style="cursor: pointer; font-size: 12px;  padding: 0; margin-bottom: 0px; width: 15px; height: 15px;">&#xf019;</i>'+
																							'</a>'
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

		thirdPartyVerifiedRequests: function() {
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			
		    if(entity==undefined) return;
			
		    var instance;
		    
			App.contracts.BGC.deployed().then(function(inst) {
			   instance = inst;
			   return instance.personVerificationRequestByMe({
					from: entity,
					gas: 500000
			  });
			}).then(function(result) {
//		        console.log("all ids for org are :"+result);
		        $.each(result, function( index, value ){
//            	  	console.log("now fetch details for person: "+value.toNumber());
	            	instance.personVerificationDetails(value.toNumber(),{
		  	                from: entity,
		  	                gas: 500000
			  	    }).then(function(result) {
//			  	    	console.log("thirdPartyVerifiedRequests Address :"+web3.toBigNumber(value.toNumber()).isZero()+"Person id :"+value+" details are : "+result);
			  	    	if(!web3.toBigNumber(value.toNumber()).isZero()) App.buildThirdPartyVerifiedRequestRow(result[0],
			  	    														web3.toAscii(result[1]).replace(/\u0000/g, ''),
			  	    														result[8],
			  	    														web3.toAscii(result[9]).replace(/\u0000/g, ''),
			  	    														result[6],
			  	    														result[7],
			  	    														result[10]
			  	    														);
		  	        }).catch(function(err) {
		  	            console.error(err);
		  	        });	
		        });
		    }).catch(function(err) {
				  console.error(err);
			});
			
		},

		buildThirdPartyVerifiedRequestRow: function(personAddrs, personName, orgAddrs,orgName,status,comments,id ) {
			var entity = sessionStorage.entityAddress;
			$('table#thirdPartyVerifiedRequest').dataTable().fnAddData( [ personAddrs,
															  personName,
															  orgAddrs,
															  orgName,
															  App.getStatusLabel(status),
															  comments,
												        '<button type="button" class="btn btn-xs btn-default command-delete" id="'+id+'" onclick="App.shareVerifiaction(this)" > <i class="fa">&#xf1d9;</i> </button>'
														]);
		},
		
		shareVerifiaction:function(ele){
			//load details in popup
			var entity = sessionStorage.entityAddress;
					
			App.contracts.BGC.deployed().then(function(instance) {
              return instance.personVerificationDetails(ele.id,{
	                from: entity,
	                gas: 500000
	          });
		    }).then(function(result) {
//		    console.log("person details "+result);
		    	$('#sharePersonUserId').val(result[10]);
		    	$('#sharePersonUserAddress').val(result[0]);
		    	$('#sharePersonFullName').val(web3.toAscii(result[1]).replace(/\u0000/g, ''));
				$('#sharePersonVerifiedBy').val(web3.toAscii(result[9]).replace(/\u0000/g, ''));
				$('#sharePersonVerifiactionStatus').val(result[6].toString());
				$('#sharePersonVerifiactionComments').val(result[7]);
	        }).catch(function(err) {
	            console.error(err);
	        });
			
			$('#sharePersonVerifiactionPopup').css('display', 'block');	
		},
		
		shareProfileWithOrganisation:function(){
			//share with org
			var entity = sessionStorage.entityAddress;
			var id = $('#sharePersonUserId').val();
			var org = $('#sharePersonVerifiactionOrgAddress').val();
//			console.log("share id:"+id+"\t"+org);
			App.contracts.BGC.deployed().then(function(instance) {
	              return instance.sharePersonVerificationResult(id,org,{
		                from: entity,
		                gas: 500000
		          });
		    }).then(function(result) {
		    	alert("person details have been shared and receipt:"+result);
		    	location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });
			$('#sharePersonVerifiactionPopup').css('display', 'none');
		},
	
		updatePersonAddDocumentPopup: function(ele) {
			var _recipient = $('#organisationUpdatePersonUserAddress').val();
			$('#userDocAddressId').val(_recipient);
			
			$('#organisationUpdatePersonAddDocumentPopup').css('display', 'block');
		},
		rejectUpdatePersonDocument:function(){
			$('#organisationUpdatePersonAddDocumentPopup').css('display', 'none');
		},
		
		approvePersonVerificationDetails:function(){
				var entity = sessionStorage.entityAddress;
				var person = $('#personDetailsForVerificationPopupUserAddress').val();
				var comments = $('#personDetailsForVerificationPopupApproverComments').val();
						
				App.contracts.BGC.deployed().then(function(instance) {
	              return instance.approvePersonVerificationDetails(person,comments,{
		                from: entity,
		                gas: 500000
		          });
			    }).then(function(result) {
//			    	console.log("person details have been approved by organisation");
		        }).catch(function(err) {
		            console.error(err);
		        });
				
				$('#fetchPersonDetailsForVerificationPopup').css('display', 'none');
				location.reload();
		},
		
		rejectPersonVerificationDetails:function(){
			$('#fetchPersonDetailsForVerificationPopup').css('display', 'none');
		},
		
		
		buildDocumentRow: function(document, docName,docExt,issuer,approver,status,comments ) {
			$('table#updatePersonDocuments').dataTable().fnAddData( [ document,
														docName,
														issuer,
														approver,
														App.getStatusLabel(status),
														comments,
														'<a class="btn btn-xs btn-default command-delete" download="'+docName+'" href="http://localhost:5000/uploads//'+document+"."+docExt+'">'+
														'<i class="fa" style="cursor: pointer; font-size: 12px;  padding: 0; margin-bottom: 0px; width: 15px; height: 15px;">&#xf019;</i>'+
														'</a>'+
														'<button type="button" class="btn btn-xs btn-default command-delete" id="'+document+'" onclick="App.deletePersonDocumentRow(this)" > <i class="fa fa-trash"></i> </button>'
														]);
		},
		
		deletePersonDocumentRow:function(ele){
			if (confirm("Are you sure you want to delete document.") == true) {
				console.log("Organisation deleted record id :"+ele.id);
				
				var entity = sessionStorage.entityAddress;
				var type = sessionStorage.e_type;
				var instance;
				var address = $('#organisationUpdatePersonUserAddress').val();
				
				App.contracts.BGC.deployed().then(function(inst) {
					 instance = inst;
		              return instance.removeDocument(ele.id,address,{
			                from: entity,
			                gas: 500000
			          });
			    }).then(function(result) {
			    	alert("Document has been deleted by organisation receipt:"+result);
			    	location.reload();
		        }).catch(function(err) {
		            console.error(err);
		        });
				
			}
		},
	
		
		downloadOrgnisationPersonDocument:function(ele){
			console.log("Organisation want to download person document id :"+ele.id);
		},
		
		enrollRecruitPerson:function(){
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			var instance;
			var address = $('#recruitPersonUserAddress').val();
			
			App.contracts.BGC.deployed().then(function(inst) {
				 instance = inst;
	              return instance.enrollPerson(address,{
		                from: entity,
		                gas: 500000
		          });
		    }).then(function(result) {
		    	alert("person has been hired by organisation receipt:"+result);
//		    	console.log("person has been hired by organisation");
		    	location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });
			
			
		},
		
		verificatinoPersonSearch: function() {
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			
			var instance;
			var address = $('#verificatinoPersonUserAddress').val();
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
//		    	console.log("check whether organisaton has any permission to view :" + result);
	            if(!result[7]){
	            	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
	    	            window.location = './organisation.html?#toverify';
	    	            return new Promise(function(resolve, reject) {
		                    reject(new Error('Organisation cancel to view Person details!'));
		                });
	    	        }else{
	    	        	return instance.addProfileRequest(address,false,false,false,{
			                from: entity,
			                gas: 500000
			          });	
	    	        }
	            }else{
	            	return instance.getPerson({
		                from: address,
		                gas: 500000
		            });  	
	            }	
		    	
	        }).then(function(result) {
//	        	console.log("result:" + result);
	            var fName = web3.toAscii(result[1]).replace(/\u0000/g, '');
	            var dob = web3.toAscii(result[4]).replace(/\u0000/g, '');
	            var gender = web3.toAscii(result[5]).replace(/\u0000/g, '');
	            var email = web3.toAscii(result[9]).replace(/\u0000/g, '');
	            $('#verificatinoPersonFullName').val(fName);
	            $('#verificatinoPersonDob').val(dob);
	            $('#verificatinoPersonGender').val(gender);
	            $('#verificatinoPersonEmail').val(email);
	            
	        }).catch(function(err) {
	            console.error(err);
	        });
		},
		
		verificatinoOrganisationSearch: function() {
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			
			var instance;
			var address = $('#verificatinoPersonOrgAddress').val();
			App.contracts.BGC.deployed().then(function(inst) {
				 instance = inst;
	            return instance.isEntityExist({
	                from: address,
	                gas: 500000
	            });
	        }).then(function(result) {
		        	if(!result){
		        		return new Promise(function(resolve, reject) {
		                    reject(new Error('Given Org address does not exist in network!'));
		                });
		        	}
            	return instance.getEntity({
	                from: address,
	                gas: 500000
	            });  	
	        }).then(function(result) {
//	        	console.log("result:" + result);
	            var fName = web3.toAscii(result[1]).replace(/\u0000/g, '');
	            var regNo = web3.toAscii(result[2]).replace(/\u0000/g, '');
	            $('#verificatinoOrgFullName').val(fName);
	            $('#verificatinoOrgRegNo').val(regNo);
	        }).catch(function(err) {
	            console.error(err);
	        });
		},
		
		verifyPersonByOrganisation: function() {
			
			var orgAddress = $('#verificatinoPersonOrgAddress').val();
			var personAddress = $('#verificatinoPersonUserAddress').val();
			var entity = sessionStorage.entityAddress;
			
			var instance;
			App.contracts.BGC.deployed().then(function(inst) {
				 instance = inst;
	            return instance.isEntityExist({
	                from: orgAddress,
	                gas: 500000
	            });
	        }).then(function(result) {
	        	if(!result){
	        		return new Promise(function(resolve, reject) {
	                    reject(new Error('Given Org address does not exist in network!'));
	                });
	        	}
	        	return instance.isPersonExist({
	                from: personAddress,
	                gas: 500000
	            });
	        }).then(function(result) {
		        	if(!result){
		        		return new Promise(function(resolve, reject) {
		                    reject(new Error('Given Person address does not exist in network!'));
		                });
		        	}	
	        	return instance.personVerificationRequest(personAddress,orgAddress,{
	                from: entity,
	                gas: 500000
	            });  	
	        }).then(function(result) {
	        	alert("verification request has been rasied receipt:"+result);
//	        	console.log("verification request receipt:" + result);
	        	location.reload();
	        }).catch(function(err) {
	            console.error(err);
	        });
		},

		
		
		
		enrollPersonSearch: function() {
			var entity = sessionStorage.entityAddress;
			var type = sessionStorage.e_type;
			var instance;
			var address = $('#recruitPersonUserAddress').val();
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
//		    	console.log("check whether organisaton has any permission to view :" + result);
	            if(!result[7]){
	            	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
	    	            window.location = './organisation.html?#toupdate';
	    	            return new Promise(function(resolve, reject) {
		                    reject(new Error('Organisation cancel to view Person details!'));
		                });
	    	        }else{
	    	        	return instance.addProfileRequest(address,false,false,false,{
			                from: entity,
			                gas: 500000
			          });	
	    	        }
	            }else{
	            	return instance.getPerson({
		                from: address,
		                gas: 500000
		            });  	
	            }	
		    	
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
	            $('#recruitPersonFullName').val(fName);
	            $('#recruitPersonOccupation').val(occupation);
	            $('#recruitPersonIncome').val(result[3]);
	            $('#recruitPersonDob').val(dob);
	            $('#recruitPersonGender').val(gender);
	            $('#recruitPersonAddressLine1').val(raddress1);
	            $('#recruitPersonAddressLine2').val(raddress2);
	            $('#recruitPersonMobile').val(result[8]);
	            $('#recruitPersonEmail').val(email);
	            $('#recruitPersonCountry').val(country);
	            $('#recruitPersonPhotoId').attr('src',result[11]);
	        }).catch(function(err) {
	            console.error(err);
	        });
			
		},
		
		updatePersonSearch: function() {
				var entity = sessionStorage.entityAddress;
				var type = sessionStorage.e_type;
				var instance;
				var address = $('#organisationUpdatePersonUserAddress').val();
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
//			    	console.log("check whether organisaton has any permission to view :" + result);
	                if(!result[7]){
	                	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
	        	            window.location = './organisation.html?#toupdate';
	        	            return new Promise(function(resolve, reject) {
			                    reject(new Error('Organisation cancel to view Person details!'));
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
		            var path = result[11];
		            
		            $('#organisationUpdatePersonFullName').val(fName);
		            $('#organisationUpdatePersonOccupation').val(occupation);
		            $('#organisationUpdatePersonIncome').val(result[3]);
		            $('#organisationUpdatePersonDob').val(dob);
		            $('#organisationUpdatePersonGender').val(gender);
		            $('#organisationUpdatePersonAddressLine1').val(raddress1);
		            $('#organisationUpdatePersonAddressLine2').val(raddress2);
		            $('#organisationUpdatePersonMobile').val(result[8]);
		            $('#organisationUpdatePersonEmail').val(email);
		            $('#organisationUpdatePersonCountry').val(country);
		            $('#personDetailsForVerificationPopupPersonPhotoId').attr('src',path);
		            $('table#updatePersonDocuments').DataTable().clear().draw();
		            
		            console.log("Document :" + path);
		            $.each(result[12], function( index, value ){
		            	if(!web3.toBigNumber(value).isZero()) {
			            	instance.getDocument(value,{
			  	                from: address,
			  	                gas: 500000
					  	    }).then(function(result) {
				  	          console.log("Document result:" + result);
				  	          App.buildDocumentRow(web3.toAscii(result[1]).replace(/\u0000/g, ''),
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
		
		updateOrganisationPersonDetails:function(){
				var entity = sessionStorage.entityAddress;
				var type = sessionStorage.e_type;
			    
				if(entity==undefined) {
					console.log("Login Organisation details not found ");
					return;
				}
				
				var fName = $('#organisationUpdatePersonFullName').val();
				var occupation = $('#organisationUpdatePersonOccupation').val();
				var income = $('#organisationUpdatePersonIncome').val();
				var dob = $('#organisationUpdatePersonDob').val();
				var gender = $('#organisationUpdatePersonGender').val();
				var rAddress1 = $('#organisationUpdatePersonAddressLine1').val();
				var rAddress2 = $('#organisationUpdatePersonAddressLine2').val();
				var mobile = $('#organisationUpdatePersonMobile').val();
				var email = $('#organisationUpdatePersonEmail').val();
				var country = $('#organisationUpdatePersonCountry').val();
				var address = $('#organisationUpdatePersonUserAddress').val();
				var path = $('#personDetailsForVerificationPopupPersonPhotoId').attr("src");
//				console.log("organisation want to update person info for:"+address);
				var instance;
				App.contracts.BGC.deployed().then(function(inst) {
					instance = inst;
		            return instance.isPersonExist({
		                from: address,
		                gas: 500000
		            });
		        }).then(function(result) {
//		            console.log("isPersonExist:" + result);
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
//		            console.log("check whether organisaton has any permission to view :" + result);
	                if(!result[7]){
	                	if (confirm("Access denied! Take permission from the Person to proceed") == false) {
	        	            window.location = './organisation.html?#toupdate';
	        	            return new Promise(function(resolve, reject) {
			                    reject(new Error('Organisation cancel to view Person details!'));
			                });
	        	        }else{
	        	        	return instance.addProfileRequest(address,true,true,false,{
				                from: entity,
				                gas: 500000
				          });	
	        	        }
	                }else{
	                	return instance.updatePerson(fName,occupation,income,dob,gender,rAddress1,rAddress2,mobile,email,country,path,{
			                from: address,
			                gas: 500000
			          });  	
	                }
	              
		        }).then(function(result) {
		        	alert("Person details has been updated receipt:"+result);
//		        	console.log(" receipt:" + result);
		        	location.reload();
		        }).catch(function(err) {
		            console.error(err);
		        });
				
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
	                    reject(new Error('Given organisation address does not exist in network!'));
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
		    	        	$('#personDetailsForVerificationPopupPersonPhotoId').attr("src", path);
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
