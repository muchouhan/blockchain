pragma solidity ^0.4.18;
import "./lib/StringUtils.sol";
import "./ownership/Ownable.sol";
import "./lifecycle/Destructible.sol";


contract App is Ownable,Destructible {
    /**
     * This is status enum used to indentify document status
     */
    enum Status {DEFAULT,APPROVED,REJECTED}

    enum EType {UNIVEERSITY,ORGANISATION}

    struct Person{
        address  addrs;
        bytes32 password;
        bytes32  fName; // name of document
        bytes32  occupation;
        uint  income;
        bytes11  dob;
        bytes1   gender;
        bytes32  rAddress1;
        bytes32  rAddress2;
        uint  mobile;
        bytes32  email;
        bytes32  country;
        bytes32[]  documentList; // list of document keys so we can look them up
    }

    struct Entity{
        bytes32 name; // name of document
        address addrs;
        bytes32 password;
        EType etype;
        bytes32 regNo;
        address[] trdPrtyVerfnList;
        address[]  personList;
        mapping (address => uint) personRoleNo;
    }

    struct ProfileRequest{
        address person;
        address requester;
        bool canView;
        bool canModify;
        bool canModifyDocument;
        uint status;
        string comments;
    }
    
    struct TrdPrtyVerfnRequest{
         uint id;
         address requester;//				- LTI
         address requestBy;//requester org  - LTI
         address requestTo;//Third party org - TPV
         address requestFor;//Person		- Mukund
         string comments;
     	 Status status;   
    }
	
	struct Document{
        address issuer;
        address recipient;
        bytes32 document; // this is only document hash value
        bytes32 name; // name of document
        address approver;
        Status status; // = Status.DEFAULT;// this is document status, used enum
        string comments;
        mapping (address => uint) documentIndex;
    }
	
	
    /**
     * mapping of records
     */
    ProfileRequest[]  profileRequest;
    ProfileRequest[]  docRequest;
    TrdPrtyVerfnRequest[] trdPrtyVerfnRequests;
    
    mapping (bytes32 => Document) public documents;
    bytes32[]  documentList;
    
    mapping (address => Person) public persons;
    address[]  personList;
    
    mapping (address => Entity) entities;
    address[]  entityList;

    /**
     * events
     */
    event DocumentIssued(bytes32 document,address recipient,bytes32 name, string comments);

    event DocumentApproved(bytes32 document,address approver,string comments);

    event DocumentRejected(bytes32 document,address approver,string comments);

    event PersonAdded(address addrs,bytes32 fName,bytes32 occupation, uint income,bytes11 dob, bytes1 gender,bytes32 rAddress1,bytes32 rAddress2,uint mobile,bytes32 email,bytes32 country);
    event PersonUpdated(address addrs,bytes32 fName,bytes32 occupation, uint income,bytes11 dob, bytes1 gender,bytes32 rAddress1,bytes32 rAddress2,uint mobile,bytes32 email,bytes32 country);

    event EntityAdded(address addrs,bytes32 name,bytes32 regNo,uint etype);
    
	
	/**
	 *This method is used to raise third party verification request 
	 * sender would be the Organisation who is raising the request 
	 */
	function personVerificationRequest(address _person,address _requestTo) payable public{
	    	require(_person !=address(0));
	        require(persons[_person].addrs!=address(0));
	    	require(msg.sender !=address(0));
	        require(entities[msg.sender].addrs!=address(0));
	        require(_requestTo !=address(0));
	        require(entities[_requestTo].addrs!=address(0));
	        trdPrtyVerfnRequests.push(TrdPrtyVerfnRequest(trdPrtyVerfnRequests.length,msg.sender,msg.sender,_requestTo,_person,"",Status.DEFAULT));
    }
	
    /**
	 *This method will give list of person which require third party verification
	 * this is for third party in request tab
	 */
	function personVerificationRequestForMe() public view returns(uint[]){
	    	require(msg.sender !=address(0));
	        require(entities[msg.sender].addrs!=address(0));
			uint count=0;
			uint[] memory ids = new uint[](trdPrtyVerfnRequests.length);
			for(uint256 i = 0; i < trdPrtyVerfnRequests.length; i++){
	            if(trdPrtyVerfnRequests[i].requestTo == msg.sender && trdPrtyVerfnRequests[i].status == Status.DEFAULT){
	                 ids[count]=trdPrtyVerfnRequests[i].id;
	                 count++;
	            }
	        }
	        return ids;
	}
	
	
	/**
	 *This method is used to raise third party verification request
	 * this is for org which has raised request and can see in verification tab  
	 */
	function personVerificationRequestByMe() public view returns(uint[]){
	    	require(msg.sender !=address(0));
	        require(entities[msg.sender].addrs!=address(0));
	        uint count=0;
	        uint[] memory ids = new uint[](trdPrtyVerfnRequests.length);
	        
	        for(uint256 i = 0; i < trdPrtyVerfnRequests.length; i++){
	            if(trdPrtyVerfnRequests[i].requester == msg.sender){
	                 ids[count]=trdPrtyVerfnRequests[i].id;
	                 count++;
	            }
	        }
	        return ids;
	}
	
	function personVerificationDetails(uint _id) public view returns(address,bytes32,bytes1,bytes32,address,bytes32,uint,string,address,bytes32){
	    	require(msg.sender !=address(0));
	        require(entities[msg.sender].addrs!=address(0));
	        
	        for(uint256 i = 0; i < trdPrtyVerfnRequests.length; i++){
	            if(trdPrtyVerfnRequests[i].id == _id){
					return(trdPrtyVerfnRequests[i].requestFor,
					    persons[trdPrtyVerfnRequests[i].requestFor].fName,
					    persons[trdPrtyVerfnRequests[i].requestFor].gender,
					    persons[trdPrtyVerfnRequests[i].requestFor].email,
					    trdPrtyVerfnRequests[i].requestBy,
					    entities[trdPrtyVerfnRequests[i].requestBy].name,
					    uint(trdPrtyVerfnRequests[i].status),
					    trdPrtyVerfnRequests[i].comments,
					    trdPrtyVerfnRequests[i].requestTo,
					    entities[trdPrtyVerfnRequests[i].requestTo].name
					);	            	
	            }
	        }
	}
	
	function approvePersonVerificationDetails(address _person,string _comments) payable public {
		    	require(_person !=address(0));
		        require(persons[_person].addrs!=address(0));
		        
		        require(msg.sender !=address(0));
		        require(entities[msg.sender].addrs!=address(0));
		        
		        
		        for(uint256 i = 0; i < trdPrtyVerfnRequests.length; i++){
		            if(trdPrtyVerfnRequests[i].requestFor == _person 
		                	&& trdPrtyVerfnRequests[i].requestTo==msg.sender){
						    trdPrtyVerfnRequests[i].status = Status.APPROVED;
						    trdPrtyVerfnRequests[i].comments = _comments;
						    return;
		            }
		        }
	}
	
	
	/**
	 *This method is used to raise third party verification request
	 * this is for org which has raised request and can see in verification tab  
	 */
	function sharePersonVerificationResult(uint _pid,address _target) payable public {
		        require(msg.sender !=address(0));
		        require(entities[msg.sender].addrs!=address(0));
		        
		        require(_target !=address(0));
		        require(entities[_target].addrs!=address(0));
				
				trdPrtyVerfnRequests.push(TrdPrtyVerfnRequest(trdPrtyVerfnRequests.length,
														      _target,
														      trdPrtyVerfnRequests[_pid].requestBy ,
														      trdPrtyVerfnRequests[_pid].requestTo,
														      trdPrtyVerfnRequests[_pid].requestFor,
														      trdPrtyVerfnRequests[_pid].comments,
														      trdPrtyVerfnRequests[_pid].status
				));
	}
	
	/**
	 * 
	 */
    function addProfileRequest(address _person,bool _canView,bool _canModify,bool _canModifyDocument) public{
        require(msg.sender !=address(0));
        require(_person !=address(0));
        require(persons[_person].addrs!=address(0));
        require(entities[msg.sender].addrs!=address(0));
        profileRequest.push(ProfileRequest(_person, msg.sender, _canView,_canModify,_canModifyDocument,0,""));
    }
    
	/**
	 * 
	 */
    function personProfileRequests() public view returns(address[]){
        require(msg.sender !=address(0));
        require(persons[msg.sender].addrs!=address(0));
        uint count=0;
        address[] memory userRequest = new address[](profileRequest.length);
        
        for(uint256 i = 0; i < profileRequest.length; i++){
            if(profileRequest[i].person == msg.sender)
                    userRequest[count]=profileRequest[i].requester;
                    count++;
        }
        
        return userRequest;
    }
      
    function profileRequestDetails(address _sender) public view returns(address,bytes32,uint,bytes32,bytes1,bytes32,bool,bool,bool){
        require(msg.sender !=address(0));
        require(persons[msg.sender].addrs!=address(0));
        require(entities[_sender].addrs!=address(0));
        
        for(uint256 i = 0; i < profileRequest.length; i++){
            if(profileRequest[i].person == msg.sender &&
                 profileRequest[i].requester == _sender)
                     return (profileRequest[i].requester,entities[_sender].name,uint(entities[_sender].etype),persons[msg.sender].fName,persons[msg.sender].gender,persons[msg.sender].email, profileRequest[i].canView,profileRequest[i].canModify,profileRequest[i].canModifyDocument);
        }
    }
    
    function updateProfileRequest(address _sender,bool _canView,bool _canModify,bool _canModifyDocument ) payable public {
        require(msg.sender !=address(0));	
        require(_sender !=address(0));
        require(persons[msg.sender].addrs!=address(0));
        require(entities[_sender].addrs!=address(0));
        
        for(uint i = 0; i < profileRequest.length; i++){
            if(profileRequest[i].requester == _sender && profileRequest[i].person == msg.sender) {
                profileRequest[i].canView = _canView;
                profileRequest[i].canModify = _canModify;
                profileRequest[i].canModifyDocument = _canModifyDocument;
                return;
            }
        }
    }
    
    function deleteProfileRequest(address _sender) payable public {
        require(msg.sender !=address(0));	
        require(_sender !=address(0));
        require(persons[msg.sender].addrs!=address(0));
        require(entities[_sender].addrs!=address(0));
        
        for(uint i = 0; i < profileRequest.length; i++){
            if(profileRequest[i].requester == _sender && profileRequest[i].person == msg.sender) {
                delete profileRequest[i];
                return;
            }
        }
    }
    



    function documentRequest(bool _canView,bool _canModify, address _sender) public{
        require(msg.sender !=address(0));
        require(_sender !=address(0));
        require(persons[msg.sender].addrs!=address(0));
        require(entities[_sender].addrs!=address(0));
        for(uint i = 0;
        i < docRequest.length;
        ++ i){
            if(docRequest[i].requester== _sender && docRequest[i].person == msg.sender) {
                docRequest[i].canView = _canView;
                docRequest[i].canModify = _canModify;
                return;
            }
        }
    }

    function documentCount() public view returns (uint){
        return documentList.length;
    }

    /**
     * this can be done by only university
     */
    function removeDocument(bytes32 _document) payable public returns (bool){
        // documentIndex
        require(documents[_document].issuer == msg.sender);
        // delete documentList[documents[_document].documentIndex[_recipient]];
        delete(documents[_document]);
    }

    function issueDocument(bytes32 _document,address _recipient, bytes32 _name,string _comment) payable public returns (bool){
        require(documents[_document].issuer == address(0));
        require(msg.sender !=address(0));
        require(persons[_recipient].addrs !=address(0));
        persons[_recipient].documentList.push(_document);
        documentList.push(_document);
        documents[_document].issuer = msg.sender;
        documents[_document].recipient = _recipient;
        documents[_document].name = _name;
        documents[_document].status = Status.DEFAULT;
        documents[_document].comments=_comment;
        // trigger event
        DocumentIssued(_document,_recipient,_name,_comment);
        return true;
    }

    function approveDocument(bytes32 _document,string _comment) payable public returns (bool){
        require(documents[_document].issuer != address(0));
        documents[_document].approver = msg.sender;
        documents[_document].status = Status.APPROVED;
        documents[_document].comments=_comment;
        // trigger event
        DocumentApproved(_document,msg.sender,_comment);
        return true;
    }

    function rejectDocument(bytes32 _document,string _comment) payable public returns (bool){
        require(documents[_document].issuer != address(0));
        documents[_document].approver = msg.sender;
        documents[_document].status = Status.REJECTED;
        documents[_document].comments = _comment;
        // trigger event
        DocumentRejected(_document,msg.sender,_comment);
        return true;
    }

    function getDocument(bytes32 _document) public view returns (address,address,bytes32,bytes32,address,uint,string){
        require(documents[_document].issuer != address(0));
        return (documents[_document].issuer,
                    documents[_document].recipient,
                    documents[_document].document,
                    documents[_document].name,
                    documents[_document].approver,
                    uint(documents[_document].status),
                    documents[_document].comments);
    }

    /**
     * Person services
     */
    function personCount() public view returns (uint){
        return personList.length;
    }

    function addPerson(bytes32 _fName,bytes32 _occupation,
                     uint _income,bytes11 _dob,
                     bytes1 _gender,bytes32 _rAddress1,
                     bytes32 _rAddress2,uint _mobile,
                     bytes32 _email,bytes32 _country) payable public{
        require(persons[msg.sender].addrs == address(0));
        personList.push(msg.sender);
        persons[msg.sender].addrs = msg.sender;
        persons[msg.sender].fName = _fName;
        persons[msg.sender].occupation =_occupation;
        persons[msg.sender].income =_income;
        persons[msg.sender].dob =_dob;
        persons[msg.sender].gender =_gender;
        persons[msg.sender].rAddress1 =_rAddress1;
        persons[msg.sender].rAddress2 =_rAddress2;
        persons[msg.sender].mobile =_mobile;
        persons[msg.sender].email =_email;
        persons[msg.sender].country =_country;
        // trigger event
        PersonAdded(msg.sender,_fName,_occupation,_income,_dob,_gender,_rAddress1,_rAddress2,_mobile,_email,_country);
    }
    
    function updatePerson(bytes32 _fName,bytes32 _occupation,
                     uint _income,bytes11 _dob,
                     bytes1 _gender,bytes32 _rAddress1,
                     bytes32 _rAddress2,uint _mobile,
                     bytes32 _email,bytes32 _country) payable public{
        require(persons[msg.sender].addrs != address(0));
        personList.push(msg.sender);
        persons[msg.sender].addrs = msg.sender;
        persons[msg.sender].fName = _fName;
        persons[msg.sender].occupation =_occupation;
        persons[msg.sender].income =_income;
        persons[msg.sender].dob =_dob;
        persons[msg.sender].gender =_gender;
        persons[msg.sender].rAddress1 =_rAddress1;
        persons[msg.sender].rAddress2 =_rAddress2;
        persons[msg.sender].mobile =_mobile;
        persons[msg.sender].email =_email;
        persons[msg.sender].country =_country;
        // trigger event
        PersonUpdated(msg.sender,_fName,_occupation,_income,_dob,_gender,_rAddress1,_rAddress2,_mobile,_email,_country);
    }

    function isPersonExist() public view returns (bool){
        if(persons[msg.sender].addrs == address(0))
              return false;
        else return true;
    }

    function setPassword(bytes32 _password) payable public{
        require(msg.sender != address(0));
        persons[msg.sender].addrs=msg.sender;
        persons[msg.sender].password=_password;
    }

    function authenticatePerson(bytes32 _password) public view returns (bool){
        require(msg.sender != address(0));
        return (persons[msg.sender].password == _password);
    }

    function getPerson() public view returns (address,bytes32,bytes32,uint,bytes11,bytes1,bytes32,bytes32,uint,bytes32,bytes32,bytes32[]){
        require(persons[msg.sender].addrs != address(0));
        return (persons[msg.sender].addrs,
            persons[msg.sender].fName,
            persons[msg.sender].occupation,
            persons[msg.sender].income,
            persons[msg.sender].dob,
            persons[msg.sender].gender,
            persons[msg.sender].rAddress1,
            persons[msg.sender].rAddress2,
            persons[msg.sender].mobile,
            persons[msg.sender].email,
            persons[msg.sender].country,
            persons[msg.sender].documentList);
    }

    function getPersonDocuments() public view returns (bytes32[]){
        require(persons[msg.sender].addrs != address(0));
        return persons[msg.sender].documentList;
    }

    /**
     * Entity services
     */
    function authenticateEntity(bytes32 _password) public view returns (bool,uint){
        require(msg.sender != address(0));
        return ((entities[msg.sender].password == _password), uint(entities[msg.sender].etype));
    }

    function entityCount() public view returns (uint){
        return entityList.length;
    }

    function addEntity(bytes32 _name,bytes32 _password,bytes32 _regNo,uint _etype) payable public{
        require(entities[msg.sender].addrs == address(0));
        entityList.push(msg.sender);
        entities[msg.sender].name = _name;
        entities[msg.sender].password=_password;
        entities[msg.sender].addrs = msg.sender;
        entities[msg.sender].regNo =_regNo;
        entities[msg.sender].etype =EType(_etype);
        // trigger event
        EntityAdded(msg.sender,_name,_regNo,_etype);
    }

    function isEntityExist() public view returns (bool){
        if(entities[msg.sender].addrs == address(0))
            return false;
        else 
        	return true;
    }

    function getEntity() public view returns (address,bytes32,bytes32,uint,uint){
        require(entities[msg.sender].addrs != address(0));
        return (entities[msg.sender].addrs,
                  entities[msg.sender].name,
                  entities[msg.sender].regNo,
                  uint(entities[msg.sender].etype),
                  entities[msg.sender].personList.length);
    }

    function enrollPerson(address _person) payable public {
        require(_person != address(0));
        entities[msg.sender].personRoleNo[_person] = entities[msg.sender].personList.length;
        entities[msg.sender].personList.push(_person);
    }

    function enrollment() public view returns (address[]){
        require(msg.sender != address(0));
        return entities[msg.sender].personList;
    }
}


