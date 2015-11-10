var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
clientLogs = finesse.cslogger.ClientLogger || {}; // for logging

// Gadget Config needed for instantiating ClientServices
/** @namespace */
finesse.gadget.Config = (function() {
	var _prefs = new gadgets.Prefs();

	/** @scope finesse.gadget.Config */
	return {
		authorization : _prefs.getString("authorization"),
		country : _prefs.getString("country"),
		language : _prefs.getString("language"),
		locale : _prefs.getString("locale"),
		host : _prefs.getString("host"),
		hostPort : _prefs.getString("hostPort"),
		extension : _prefs.getString("extension"),
		mobileAgentMode : _prefs.getString("mobileAgentMode"),
		mobileAgentDialNumber : _prefs.getString("mobileAgentDialNumber"),
		xmppDomain : _prefs.getString("xmppDomain"),
		pubsubDomain : _prefs.getString("pubsubDomain"),
		restHost : _prefs.getString("restHost"),
		scheme : _prefs.getString("scheme"),
		localhostFQDN : _prefs.getString("localhostFQDN"),
		localhostPort : _prefs.getString("localhostPort"),
		clientDriftInMillis : _prefs.getInt("clientDriftInMillis")
	};
}());

/** @namespace */
finesse.modules = finesse.modules || {};
/**
 * ACI Namespace to load the sfdc window
 */
window.ACI = window.ACI || {};
finesse.modules.SampleGadget = (function($) {
	var recentCalls=[];
	var user, dialogs,
	
	/**
	 * Populates the fields in the gadget with data
	 */
	render = function() {

		gadgets.window.adjustHeight();
	},

	displayCall = function(dialog) {

		var callVars = dialog.getMediaProperties();
		
		
	},

	_processCall = function(dialog) {
		displayCall(dialog);
		console.log("@@@ ACI - Updated Call - Dialed Number ["+callVars.dialedNumber+ "] Call Type ["+callVars.callType+"] toAddress ["+dialog.getToAddress()+"] fromAddress ["+dialog.getFromAddress()+"]");
		if (dialog.getState()  === finesse.restservices.Dialog.States.FAILED) {
			$('#errorMsg').html("Call Failed");
		 }
	},
	/**
	 * Handler for additions to the Dialogs collection object. This will occur
	 * when a new Dialog is created on the Finesse server for this user.
	 */
	handleNewDialog = function(dialog) {
		var callVars = dialog.getMediaProperties();
		displayCall(dialog);
		// debugger;
		if (dialog.getMediaProperties().callType === "PREROUTE_ACD_IN") {
			window.focus();
		}
		// add a dialog change handler in case the callvars didn't arrive yet
		dialog.addHandler('change', _processCall);

	},

	/**
	 * Handler for deletions from the Dialogs collection object for this user.
	 * This will occur when a Dialog is removed from this user's collection
	 * (example, end call)
	 */
	handleEndDialog = function(dialog) {
		console.log("Entered end dialog function");

		buildRecentCalls(dialog);
		console.log("Exiting end dialog function");

	},
	/**
	 * Function to build recent call list and insert it into sessionStorage
	 * the recentCall object is based on the dialog object from Cisco.
	 * It contains the dialogId, callBackNumber to make callbacks
	 * formattedPhoneNumber to display to agents and datetime of call
	 */
	buildRecentCalls = function(dialog){
		/***ADD TO SessionStorage**/
		debugger;
		//Get recent calls from sessionStorage or create an empty array
		if(sessionStorage.recentCalls===null || sessionStorage.recentCalls === undefined){
			recentCalls = [];
		}
		else{
			recentCalls=JSON.parse(sessionStorage.recentCalls);
		}
		//JSON.parse(recentCalls);
		console.log("type of recent calls "+typeof recentCalls+"]");
		
		//check for internal numbers (direction shows as inbound.
		var calltype = dialog.getMediaProperties().callType;
		var callTypeMatchInbound = calltype.match(/in/i);
		var direction="";
		var phoneNumber;
		if(calltype == "AGENT_INSIDE" || calltype=="CONFERENCE" || calltype == "CONSULT"){
			direction = "Internal Outbound";
			phoneNumber = dialog.getMediaProperties().dialedNumber;
		}
		else if(callTypeMatchInbound){
			direction ="Inbound";
			phoneNumber = dialog.getFromAddress();
		}else{
			direction = "Outbound";
			phoneNumber = dialog.getMediaProperties().dialedNumber;
		}

		//format the phone number for display
		if(phoneNumber.length == 5)
		{
			formattedPhoneNumber = phoneNumber;
		}
		else if(phoneNumber.substring(0,2)==="+1")
		{
			formattedPhoneNumber = phoneNumber.substring(0,2)+ " " + phoneNumber.substring(2,5)+" " + phoneNumber.substring(5,8)+" "+ phoneNumber.substring(8);
		}
		else{
			formattedPhoneNumber = "+1 " + phoneNumber.substring(0,3)+" " + phoneNumber.substring(3,6)+" "+ phoneNumber.substring(6);
		}
		
		dialablePhoneNumber = formattedPhoneNumber.replace(/ /g,'');
		$('#recentCalls').prepend("<tr><td><button onclick=\"finesse.modules.SampleGadget.makeCall('"+dialablePhoneNumber+"');\"><img src='/3rdpartygadget/files/RecentCalls/phone-large.png' style='width:20px;height:20px;' alt='call "+dialablePhoneNumber+"'></button></td><td>"+formattedPhoneNumber+"</td><td>"+direction+"</td></tr>");

		
		var recentCall = {"dialogId": dialog.getId(), "callBackNumber": dialablePhoneNumber,"direction":direction, "formatedNumber":formattedPhoneNumber,"endOfCall": new Date()};
		console.log("recentCalls print to screen ["+recentCall+"]");
		console.log('typeof recentCall: ' + typeof recentCall);
		console.log('recentCall properties:');
		//See the properties on a call in the console
		for (var prop in recentCall) {
		    console.log('  ' + prop + ': ' + recentCall[prop]);
		}
		console.log("recentCall stringified ["+JSON.stringify(recentCall)+"]");
		//push the most recent call onto the array of recent calls
		//retrieved from sessionStorage
		recentCalls.push(recentCall);
		console.log('recent calls total: '+recentCalls.length);
		sessionStorage.setItem("recentCalls", JSON.stringify(recentCalls));
		// Retrieve the object from storage
		var retrievedObject = JSON.parse(sessionStorage.recentCalls);

		console.log('typeof retrievedObject: ' + typeof retrievedObject);
		for(var call in retrievedObject)
		{

			for (var prop in call) {
			    console.log('  ' + prop + ': ' + call[prop]);
			}
			
		}
		console.log("Exiting end dialog function");
	},
	/**
	 * Handler for the onLoad of a User object. This occurs when the User object
	 * is initially read from the Finesse server. Any once only initialization
	 * should be done within this function.
	 */
	handleUserLoad = function(userevent) {
		// Get an instance of the dialogs collection and register handlers for
		// dialog additions and
		// removals
		dialogs = user.getDialogs({
			onCollectionAdd : handleNewDialog,
			onCollectionDelete : handleEndDialog
		});

		debugger;
		if (sessionStorage.recentCalls === null
				|| sessionStorage.recentCalls === undefined) {
			retrievedCalls = [];
		} else {
			retrievedCalls = JSON.parse(sessionStorage.recentCalls) || "";
			// JSON.parse(recentCalls);
			console.log("type of recent calls " + typeof retrievedCalls + "]");
			console.log("Ensure recentCalls is an array ["
					+ retrievedCalls.length + "]");

			console.log("retrieved calls " + retrievedCalls);
			for (var i = 0; i < retrievedCalls.length; i++) {
				console.log(retrievedCalls[i].callBackNumber);
				$('#recentCalls')
						.prepend(
								"<tr><td><button onclick=\"finesse.modules.SampleGadget.makeCall('"
										+ retrievedCalls[i].callBackNumber
										+ "');\"><img src='/3rdpartygadget/files/RecentCalls/phone-large.png' style='width:20px;height:20px;' alt='call "
										+ retrievedCalls[i].callBackNumber
										+ "'></button></td><td>"
										+ retrievedCalls[i].formatedNumber
										+ "</td><td>"
										+ retrievedCalls[i].direction
										+ "</td></tr>");

			}
		}
		render();
	},

	/**
	 * Handler for all User updates
	 */
	handleUserChange = function(userevent) {
		render();
	};
	
	/**
     * Handler for makeCall when successful.
     */
    makeCallSuccess = function(rsp) {
	
	},
    
    /**
     * Handler for makeCall when error occurs.
     */
    makeCallError = function(rsp) {
	

	$('#errorMsg').html(_util.getErrData(rsp));
	
    }
	/** @scope finesse.modules.SampleGadget */
	return {

		
		/**
		 * Make a call to the recent number
		 */
		makeCall:function(numberToDial)
		{
			user.makeCall(numberToDial,{success:makeCallSuccess,error:makeCallError});
		},
		
		/**
		 * Performs all initialization for this gadget
		 */
		init : function() {
			var prefs = new gadgets.Prefs(), id = prefs.getString("id");
			var clientLogs = finesse.cslogger.ClientLogger; // declare
			// clientLogs

			gadgets.window.adjustHeight();

			// Initiate the ClientServices and load the user object.
			// ClientServices are
			// initialized with a reference to the current configuration.
			finesse.clientservices.ClientServices.init(finesse.gadget.Config);
			// this gadget id will be logged as a part of the message
			clientLogs.init(gadgets.Hub, "Recent Calls"); 
			user = new finesse.restservices.User({
				id : id,
				onLoad : handleUserLoad,
				onChange : handleUserChange
			});

			// Initiate the ContainerServices and add a handler for when the tab
			// is visible
			// to adjust the height of this gadget in case the tab was not
			// visible
			// when the html was rendered (adjustHeight only works when tab is
			// visible)

			containerServices = finesse.containerservices.ContainerServices
					.init();
			containerServices
					.addHandler(
							finesse.containerservices.ContainerServices.Topics.ACTIVE_TAB,
							function() {
								clientLogs.log("Recent Calls Gadget is now visible");
								gadgets.window.adjustHeight();

							});
			containerServices.makeActiveTabReq();
		}
	};
}(jQuery));
