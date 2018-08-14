var App = artifacts.require("./App.sol");

// test suite
contract('App', function(accounts){
    var instance;
  it("Variable must be initialized with zero", function() {
    return App.deployed().then(function(inst) {
        instance = inst;
      return instance.entityCount({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, 0, "Organisation list size must be zero");
      return instance.personCount({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, 0, "Person list size must be zero");
      return instance.documentCount({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, 0, "Document list size must be zero");
    })
  });
/*

  it("Add University to system ", function() {
    var instance;
    return App.deployed().then(function(inst) {
      instance = inst;
      return instance.isEntityExist({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, false, "University should not exist");
      return instance.addEntity(web3.fromAscii("University name 1"),"University Reg No 1223",0,{from:web3.eth.accounts[0]});
    }).then(function(data){
        return instance.isEntityExist({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, true, "University must be exist");
      return instance.getEntity({from:web3.eth.accounts[0]});
    }).then(function(data){
        var uName =web3.toAscii(data[1]).replace(/\u0000/g, '');
        var regNo =web3.toAscii(data[2]).replace(/\u0000/g, '');
        assert.equal(data[0], web3.eth.accounts[0], "University address must be "+web3.eth.accounts[0]);
        assert.equal(uName, "University name 1", "University name must be University name 1");
        assert.equal(regNo, "University Reg No 1223", "University RegNo must be University Reg No 1223");
    })
  });

  it("Add new Person into system ", function() {
    var instance;
    return App.deployed().then(function(inst) {
      instance = inst;
      return instance.isPersonExist({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, false, "Person should not exist");
      return instance.addPerson("mukund", "mName",
                         "chouhan", "service",
                          "1000", "01-02-2010",
                         "M", "my address row 1",
                         "my address row 1", "8839202104",
                         "mukundchouhan220@gmail.com","India",{from:web3.eth.accounts[0]});
    }).then(function(data){
        return instance.isPersonExist({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, true, "Person must be exist");
      return instance.getPerson({from:web3.eth.accounts[0]});
    }).then(function(data){
        var fName =web3.toAscii(data[1]).replace(/\u0000/g, '');
        var lName =web3.toAscii(data[3]).replace(/\u0000/g, '');
        assert.equal(data[0], web3.eth.accounts[0], "Person address must be "+web3.eth.accounts[0]);
        assert.equal(fName, "mukund", "Person name must be mukund");
        assert.equal(lName, "chouhan", "Person last name must be chouhan");
    })
  });
*/
  it("Enroll a person to University ", function() {
    var instance;
    return App.deployed().then(function(inst) {
      instance = inst;
      return instance.isEntityExist({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, false, "University should not exist");
      return instance.addEntity(web3.fromAscii("University name 1"),"University Reg No 1223",0,{from:web3.eth.accounts[0]});
    }).then(function(data){
        return instance.isEntityExist({from:web3.eth.accounts[0]});
    }).then(function(data) {
      assert.equal(data, true, "University must be exist");
      return instance.getEntity({from:web3.eth.accounts[0]});
    }).then(function(data){
        var uName =web3.toAscii(data[1]).replace(/\u0000/g, '');
        var regNo =web3.toAscii(data[2]).replace(/\u0000/g, '');
        assert.equal(data[0], web3.eth.accounts[0], "University address must be "+web3.eth.accounts[0]);
        assert.equal(uName, "University name 1", "University name must be University name 1");
        assert.equal(regNo, "University Reg No 1223", "University RegNo must be University Reg No 1223");
        return instance.isPersonExist({from:web3.eth.accounts[1]});
    }).then(function(data) {
      assert.equal(data, false, "Person should not exist");
      return instance.addPerson("mukund", "mName",
                         "chouhan", "service",
                          "1000", "01-02-2010",
                         "M", "my address row 1",
                         "my address row 1", "8839202104",
                         "mukundchouhan220@gmail.com","India",{from:web3.eth.accounts[1]});
    }).then(function(data){
        return instance.isPersonExist({from:web3.eth.accounts[1]});
    }).then(function(data) {
      //console.log("isPersonExist"+data);
      assert.equal(data, true, "Person must be exist");
      return instance.getPerson({from:web3.eth.accounts[1]});
    }).then(function(data){
        var fName =web3.toAscii(data[1]).replace(/\u0000/g, '');
        var lName =web3.toAscii(data[3]).replace(/\u0000/g, '');
        //console.log("fName"+fName);
        assert.equal(data[0], web3.eth.accounts[1], "Person address must be "+web3.eth.accounts[1]);
        assert.equal(fName, "mukund", "Person name must be mukund");
        assert.equal(lName, "chouhan", "Person last name must be chouhan");
        return instance.enrollPerson(web3.eth.accounts[1],{from:web3.eth.accounts[0]});
    }).then(function(data){
        //console.log("data"+data);
        return instance.enrollment({from:web3.eth.accounts[0]});
    }).then(function(data){
        var size = data.length;
        assert.equal(size, 1, "Enrollment count must be 1");
    }).then(function(data){
        //university will upload person documents
        return instance.issueDocument("documentHashID",web3.eth.accounts[1], "10 marksheet", "pass",{from:web3.eth.accounts[0]});
    }).then(function(data){
        //university will upload person documents
        return instance.issueDocument("documentHashID1",web3.eth.accounts[1], "12 marksheet", "pass",{from:web3.eth.accounts[0]});
    }).then(function(data){
        //person will approve
        return instance.approveDocument("documentHashID", "Approved by me",{from:web3.eth.accounts[1]});
    }).then(function(data){
        //person will approve
        return instance.approveDocument("documentHashID1", "Approved by me",{from:web3.eth.accounts[1]});
    }).then(function(data){
        //person will approve
        return instance.documentCount({from:web3.eth.accounts[1]});
    }).then(function(data){
        assert.equal(data, 2, "Document count must be 1");
        return instance.getDocument("documentHashID",{from:web3.eth.accounts[0]});
    }).then(function(data){
        assert.equal(data[6], "Approved by me", "Document comments must be Approved by me");
        return instance.removeDocument("documentHashID",{from:web3.eth.accounts[0]});
    }).then(function(data){
      //console.log("data"+data);
      return instance.documentCount({from:web3.eth.accounts[0]});
    }).then(function(data){
      //get person documents;
      return instance.getPersonDocuments({from:web3.eth.accounts[1]});
    }).then(function(data){
      var fName =web3.toAscii(data[0]).replace(/\u0000/g, '');
      //assert.equal(data, 0, "Document count must be 0");
      return instance.addProfileRequest(web3.eth.accounts[1],{from:web3.eth.accounts[0]});
    }).then(function(data){
      console.log("addProfileRequest"+data);
      //return instance.addProfileRequest(web3.eth.accounts[0],{from:web3.eth.accounts[1]});
      //assert.equal(data, 0, "Document count must be 0");
    })




  });



});
