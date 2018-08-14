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
	                console.log("Deploy account:" + account);
	                App.account = account;
	            }
	        });
	    },
	
	    initContract: function() {
	        $.getJSON('App.json', function(contractArtifect) {
	            
	        	App.contracts.BGC = TruffleContract(contractArtifect);
	            // set the provider for our contracts
	            App.contracts.BGC.setProvider(App.web3Provider);
	        });
	    },
	    
	    onEntitySignUp: function() {
	        var useraddress = $('#r_useraddress').val();
	        if (useraddress == "") {
	            alert("Enter a valid Address!");
	            return;
	        }
	
	        var username = $('#r_entity').val();
	        if (username == "") {
	            alert("Enter a valid entiry name!");
	            return;
	        }
	        var password = $('#r_password').val();
	        if (password == "") {
	            alert("Enter a valid password!");
	            return;
	        }
	
	        var cpassword = $('#password_confirm').val();
	        if (password != cpassword) {
	
	            alert("Password and Confirm Password must match!");
	            return;
	        }
	
	        var reg = $('#reg_no').val();
	        if (reg == "") {
	            alert("Enter a valid registration number!");
	            return;
	        }
	
	        var type = $('#e_type').val();
	
	        if (confirm("I accept that the details provided are correct.") == false) {
	            window.location = './index.html';
	            return;
	        }
	
	        var bgcInstance;
	        App.contracts.BGC.deployed().then(function(instance) {
	            bgcInstance = instance;
	            return instance.isEntityExist({
	                from: useraddress,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("isEntityExist result:" + result);
	            if (result) {
	                alert("Given Entity already Exist in network!");
	                return new Promise(function(resolve, reject) {
	                    reject(new Error('Given Entity already Exist in network!'));
	                });
	            }
	            return bgcInstance.addEntity.sendTransaction(username, password, reg, type, {
	                from: useraddress,
	                gas: 500000
	            });
	
	        }).then(function(result) {
	           console.log("Entity added in network receipt:" + result);
	           alert(username + " has been successfully added to the network!\n" + "Login from the \"Login\" Tab on the top-right side of the webpage. \n Thank you for choosing BGC chain!");
	           window.location.replace("http://localhost:3000/index.html#tologin");
	        }).catch(function(err) {
	        	console.log(err);
	        	console.error(err);
	        });
	    },


    
	    onEntityLogin: function() {
	        var username_l = $('#l_username').val();
	        var pass_l = $('#l_password').val();
	
	        // validate input
	        if (username_l == "") {
	            alert("Enter a valid bank name!");
	            return;
	        }
	        if (pass_l == "") {
	            alert("Enter a valid password!");
	            return;
	        }
	
	        App.contracts.BGC.deployed().then(function(instance) {
	            return instance.authenticateEntity(pass_l, {
	                from: username_l,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("authenticateEntity:" + result);
	            if (!result[0]) {
	            	console.log("Authentication failed : Provided User name/ Password is incorrect!");
	                return new Promise(function(resolve, reject) {
	                    reject(new Error('Authentication failed : Provided User name/ Password is incorrect!'));
	                });
	            } else {
	                sessionStorage.entityAddress = username_l;
	                sessionStorage.e_type = result[1];
	                if (result[1] == 1) {
	                    window.location = './organisation.html';
	                } else {
	                    window.location = './university.html';
	                }
	            }
	        }).catch(function(err) {
	        	console.log(err);
	            console.error(err);
	        });
	    },
    
	  employeeSignUp: function() {
	        var username = $('#r_username').val();
	        var password = $('#r_password').val();
	        var cpassword = $('#password_confirm').val();
	        if (password != cpassword) {
	            alert("Password and Confirm Password must match!");
	            return;
	        }
	
	        var bgcInstance;
	        App.contracts.BGC.deployed().then(function(instance) {
	            bgcInstance = instance;
	            console.log("Check whether organization has already Added Employee in network");
	            return bgcInstance.isPersonExist({
	                from: username,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("isPersonExist result:" + result);
	            if (result) {
	                alert("Given username already exist in network!");
	                return new Promise(function(resolve, reject) {
	                    reject(new Error('Given username already exist in network!'));
	                });
	            }
	
	            return bgcInstance.setPassword.sendTransaction(password, {
	                from: username,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("setPassword receipt:" + result);
	            window.location = './index2.html#tologin';
	        }).catch(function(err) {
	        	console.log(err);
	            console.error(err);
	        });
	
	    },

	   employeeLogin: function() {
	
	        var username = $('#l_username').val();
	        var password = $('#l_password').val();
	
	        var bgcInstance;
	        App.contracts.BGC.deployed().then(function(instance) {
	            bgcInstance = instance;
	            return instance.authenticatePerson(password, {
	                from: username,
	                gas: 500000
	            });
	        }).then(function(result) {
	            console.log("authenticatePerson result:" + result);
	            if (!result) {
	                console.log("Given credentials are incorrect, Please try again!");
	                return new Promise(function(resolve, reject) {
	                    reject(new Error('Given credentials are incorrect, Please try again!'));
	                });
	            }
	            sessionStorage.user_address = username;
	            window.location = './person.html#tohome';
	        }).catch(function(err) {
	        	console.log(err);
	        	console.error(err);
	        });
	
	    }


};