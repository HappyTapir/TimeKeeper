/* TimeKeeper keeps track of the current time in your game using minutes.
 * It can show you the current time expressed in days, hours and minutes. 
 * TimeKeeper also tracks expiries (reminders) of spell effects and the like, and
 * shows them to you whenever you show or change the time. */

/* TimeKeeper responds to the following commands:
 * !tk show (shows the current time)
 * !tk set X (sets the current time to X, expressed in minutes X)
 * !tk add X (adds X minutes to the current time; use negative values to subtract time)
 * !tk exp charactername|effectname|X (adds expiry for charactername of effectname, expiring in X minutes)
 */

/*TODO: Add functionality where the players can retrieve non-DM-only flagged reminders.
 * The players could retrieve information in three different ways:
 * * Actual time and actual remainder of their expiries
 * Vague time (morning, noon, afternoon, evening) and vague expiries (3/4 remaining, 1/2 remaining 1/4 remaining)
 * Vague expiries only.
 * The amount of info the players would retrieve would be up to a config setting
 * */

'use strict';

//Declaration of private namespace to avoid conflicts
//Creates a new empty object if it does not exist
//Does nothing if it already exists
var HappyTapir = HappyTapir || {}; 

//Declaration of the class TimeKeeper (under the HappyTapir namespace)
HappyTapir.TimeKeeper = function () {
	this.ChatName = "TimeKeeper";
    this.Version = "0.1";

    this.Initialize = function () {
        //Setting global variables to persist between sessions
        //Check if the namespaced property exists, create it and set default values if it doesn't
        //CurrentTime will hold the current elapsed minutes
        //Expiries is an array that will hold any non-expired expiries

        if (!state.TimeKeeperGlobals) {
            state.TimeKeeperGlobals = {
                CurrentTime: 0,
                Expiries: []
            };
        }
        //If the namespaced property does exist, check that it has valid values, set them if it doesn't
        else {
            if (isNaN(state.TimeKeeperGlobals.CurrentTime) == true) {
                state.TimeKeeperGlobals.CurrentTime = 0;
            }
            if (state.TimeKeeperGlobals.Expiries == undefined) {
                state.TimeKeeperGlobals.Expiries = [];
            }
        }
        
        log(this.ChatName + " " + this.Version + " initialized. Command: !tk");
        sendChat(this.ChatName, "/w gm Initialized! Current time: " + this.FormatTimeAsString(state.TimeKeeperGlobals.CurrentTime) + " Type !tk for commands.");
    }

    this.ShowCommands = function () {
        var commandString = "";

        commandString = "<ul>";
        commandString = commandString + "<li><b>!tk</b> - displays this information.</li>";
        commandString = commandString + "<li><b>!tk show</b> - displays current time.</li>";
        commandString = commandString + "<li><b>!tk set <i>X</i></b> - sets current time to <i>X</i> minutes.</li>";
        commandString = commandString + "<li><b>!tk add <i>X</i></b> - adds <i>X</i> minutes to the current time. Use negative values to subtract time.</li>";
        commandString = commandString + "<li><b>!tk exp <i>name</i>|<i>effect</i>|<i>duration</i></b> - adds an expiry <i>effect</i> for character <i>name</i>, with <i>duration</i> in minutes.</li>";
        commandString = commandString + "</ul>";

        sendChat(this.ChatName, "/w gm " + commandString);
    }
    
	this.FormatTimeAsString = function (minutes) {
        //This formats minutes into days, hours and minutes
        var dayCount = 0;
		var hourCount = 0;
		var minuteCount = 0;
		var formattedTime = "";

		dayCount = Math.floor(minutes / 1440);
		hourCount = Math.floor((minutes - dayCount * 1440) / 60);
		minuteCount = Math.floor(minutes % 60);

        //Formatting days (nothing for 0 days; 1 day; 2 days etc)
        if (dayCount > 0) formattedTime = formattedTime + dayCount + " day";
        if (dayCount > 1) formattedTime = formattedTime + "s";
        if (dayCount > 0 && (hourCount > 0 || minuteCount > 0)) formattedTime = formattedTime + ", ";

        //Formatting hours (nothing for 0 hours; 1 hour; 2 hours etc)
        if (hourCount > 0) formattedTime = formattedTime + hourCount + " hour";
        if (hourCount > 1) formattedTime = formattedTime + "s";
        if (hourCount > 0 &&  minuteCount > 0) formattedTime = formattedTime + ", ";

        //Formatting minutes (nothing for 0 minutes; 1 minute; 2 minutes etc)
        if (minuteCount > 0) formattedTime = formattedTime + minuteCount + " minute";
        if (minuteCount > 1) formattedTime = formattedTime + "s";

        //Special case for a newly started TimeKeeper in a game
        if (minutes == 0) formattedTime = minutes + " minutes";

        //Adding final period (.)
		formattedTime = formattedTime + ".";

		return formattedTime;
	}

	this.ShowTime = function (minutes) {
        //Send a whisper to the GM with the current time
        var time = "";
		time = this.FormatTimeAsString(minutes);

		sendChat(this.ChatName, "/w gm " + time);
	}

	this.AddSubtractTime = function (minutes) {
        //Add a number of minutes to the current time. Adding negative values
        //subtracts minutes from the current time.
        state.TimeKeeperGlobals.CurrentTime = parseInt(state.TimeKeeperGlobals.CurrentTime) + parseInt(minutes);
	}

	this.AddExpiry = function (charName, effectName, duration) {
		//Creates a new expiry array of the format ["character name", "spell or effect name", time in minutes when the effect expires]
		var newExpiry = [charName, effectName, parseInt(state.TimeKeeperGlobals.CurrentTime) + parseInt(duration)];

		//Adds the newly created expiry array at the end of the global list of expiries
        state.TimeKeeperGlobals.Expiries.push(newExpiry);
	}

	this.CheckExpiry = function (expiryItem) {
		//Checks whether a particular expiry item (an array) has expired
        //Sends a whisper to the GM and returns true or false.

		//If the item has expired, i.e. the expiry time of the array entry is now or in the past
		if (parseInt(expiryItem[2]) <= parseInt(state.TimeKeeperGlobals.CurrentTime)) {
			sendChat(this.ChatName, "/w gm " + expiryItem[0] + "'s " + "<b>" + expiryItem[1] + " has expired.</b>");
			return true;
		}
		//if the item has not expired, i.e. the expiry time of the array entry isn't now or in the past
		else {
			var remainingTime = parseInt(expiryItem[2]) - parseInt(state.TimeKeeperGlobals.CurrentTime);
			var remainingAsString = this.FormatTimeAsString(remainingTime);

			sendChat(this.ChatName, "/w gm " + expiryItem[0] + "'s " + expiryItem[1] + " expires in " + remainingAsString);
			return false;
		}
	}

	this.SortExpiries = function () {
		//This compare function sorts the entries in the global expiries list by the expiry time, ascending
		if (state.TimeKeeperGlobals.Expiries.length > 0) {
			state.TimeKeeperGlobals.Expiries.sort(function (a, b) { return a[2] - b[2] });
		}

	}

	this.CheckAllExpiries = function () {
		//First, check if the global expiries array is empty. If so, just return without doing anything.

		if (state.TimeKeeperGlobals.Expiries.length == 0) {
			return;
		}

		//This function loops through all the expiries in the global expiries array
		//For each one that has not yet expired, a new expiry entry is made in a local array
		//At the end, the global expiries array is replaced by the new array, which only contains unexpired expiries
		var newExpiryArray = [];

		var expiryCount = state.TimeKeeperGlobals.Expiries.length;
		var expiryIndex;

		for (expiryIndex = 0; expiryIndex < expiryCount; expiryIndex++) {
			if (this.CheckExpiry(state.TimeKeeperGlobals.Expiries[expiryIndex]) == false) {
				newExpiryArray.push(state.TimeKeeperGlobals.Expiries[expiryIndex]);
			}
		}

		state.TimeKeeperGlobals.Expiries = newExpiryArray;

	}
    
} 
		
on('ready', function () {
    var timeKeeper = new HappyTapir.TimeKeeper();
    timeKeeper.Initialize();
});


on("chat:message", function (msg) {
    /* TimeKeeper responds to the following commands:
     * !tk show (shows the current time)
     * !tk set X (sets the current time to X, expressed in minutes X)
     * !tk add X (adds X minutes to the current time; use negative values to subtract time)
     * !tk exp charactername|effectname|X (adds expiry for charactername of effectname, expiring in X minutes)
     */

    if (msg.type == "api" && msg.who.indexOf("(GM)") !== -1 && msg.content == "!tk") {
        var timeKeeper = new HappyTapir.TimeKeeper();
        timeKeeper.ShowCommands();
    }

    if (msg.type == "api" && msg.who.indexOf("(GM)") !== -1 && msg.content.indexOf("!tk ") !== -1) {
        var timeKeeper = new HappyTapir.TimeKeeper();
        var msgArray = [];

        //Whisper the time and current expiries to the GM
        if (msg.content.indexOf(" show") !== -1) {
            timeKeeper.ShowTime(state.TimeKeeperGlobals.CurrentTime);
            timeKeeper.CheckAllExpiries();
        }

        //Set the time, then whisper current time and current expiries to the GM
        if (msg.content.indexOf(" set ") !== -1) {
            msgArray = msg.content.split(" ", 3);
            if (msgArray.length == 3 && isNaN(msgArray[2]) == false) { // i.e., "!tk set x" where "x" is a number
                state.TimeKeeperGlobals.CurrentTime = msgArray[2];
            }
            timeKeeper.ShowTime(state.TimeKeeperGlobals.CurrentTime);
            timeKeeper.CheckAllExpiries();
        }

        //Adjust the time, then whisper current time and current expiries to the GM
        if (msg.content.indexOf(" add ") !== -1) {
            msgArray = msg.content.split(" ", 3);
            timeKeeper.AddSubtractTime(msgArray[2].toLowerCase());
            timeKeeper.ShowTime(state.TimeKeeperGlobals.CurrentTime);
            timeKeeper.CheckAllExpiries();
        };

        //Add expiry, sort the expiry list, and then provide feedback to the GM about the entered expiry
        if (msg.content.indexOf(" exp ") !== -1) {
            var expiryString = msg.content.slice(7).trim();
            msgArray = expiryString.split("|") //pipe symbol used here since it is unlikely to appear in character names
            timeKeeper.AddExpiry(msgArray[0], msgArray[1], msgArray[2].toLowerCase());
            timeKeeper.SortExpiries();

            sendChat(timeKeeper.ChatName, "/w gm " + msgArray[0] + "'s " + msgArray[1] + " entered with expiry in " + timeKeeper.FormatTimeAsString(msgArray[2].toLowerCase()));
        };
    }
    
});
