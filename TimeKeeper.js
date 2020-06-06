/* TimeKeeper keeps track of the current time in your game using minutes.
 * It can show you the current time expressed in days, hours and minutes. 
 * TimeKeeper also tracks expiries (reminders) of spell effects and the like, and
 * shows them to you whenever you show or change the time. */

/* TimeKeeper responds to the following commands:
 * !tk (shows the recognized commands)
 * !tk show (shows the current time)
 * !tk set X (sets the current time to X, expressed in minutes X)
 * !tk add X (adds X minutes to the current time; use negative values to subtract time)
 * !tk exp charactername|effectname|X (adds expiry for charactername of effectname, expiring in X minutes)
 */

/* TODO: Add functionality where the players can retrieve non-DM-only flagged reminders.
 * The players could retrieve information in three different ways:
 * Actual time and actual remainder of their expiries
 * Vague time (morning, noon, afternoon, evening) and vague expiries (3/4 remaining, 1/2 remaining 1/4 remaining)
 * Vague expiries only.
 * The amount of info the players would retrieve would be up to a config setting
 */

'use strict';

//Declaration of private namespace to avoid conflicts
//Creates a new empty object if it does not exist
//Does nothing if it already exists
var HappyTapir = HappyTapir || {}; 

//Declaration of the class TimeKeeper (under the HappyTapir namespace)
HappyTapir.TimeKeeper = function () {
    this.ChatName = "TimeKeeper";
    this.Version = "0.2.0";

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

        //Send a message to the API engine log, and send a message to the game window that the script is initialized
        log(this.ChatName + " " + this.Version + " initialized. Command: !tk");

        var messageArray = [];
        messageArray.push("/w gm");
        messageArray.push("{{name=" + this.FormatTimeAsString(state.TimeKeeperGlobals.CurrentTime, true) + "}}");
        messageArray.push("{{" + this.ChatName + " " + this.Version + " initialized.}}");
        messageArray.push("{{Type !tk for commands.}}");

        sendChat(this.ChatName, this.BuildChatMessage(messageArray));
    }

    this.BuildChatMessage = function (messageArray) {
        //This function builds a message that the calling
        //function will send to the user

        var message = "";
        var i;

        message += messageArray[0].trim(); //Adressee of the message
        message += " &{template:default}";

        for (i = 1; i < messageArray.length; i++) {
            message += " " + messageArray[i].trim();
        }
        return message;
    }

    this.SendErrorMessage = function (errorArray) {
        var messageArray = [];
        messageArray.push("/w gm");
        messageArray.push("{{name=" + this.ChatName + " " + this.Version + " Error}}");
        messageArray.push("{{" + errorArray[0] + "=" + errorArray[1] + "}}");
        sendChat(this.ChatName, this.BuildChatMessage(messageArray));
    }

    this.ShowCommands = function () {
        //Whisper a list of commands that TimeKeeper will accept
        var messageArray = [];
        messageArray.push("/w gm");

        messageArray.push("{{name=" + this.FormatTimeAsString(state.TimeKeeperGlobals.CurrentTime, true) + "}}");
        messageArray.push("{{!tk - displays this information.}}");
        messageArray.push("{{!tk show - displays expiries.}}");
        messageArray.push("{{!tk set <i>X</i>- sets time to <i>X</i> minutes.}}");
        messageArray.push("{{!tk add <i>X</i> - adds <i>X</i> minutes to time. Use negative values to subtract time.}}");
        messageArray.push("{{!tk exp <i>name</i>|<i>effect</i>|<i>duration</i> - adds an expiry <i>effect</i> for character <i>name</i>, with <i>duration</i> in minutes.}}");

        sendChat(this.ChatName, this.BuildChatMessage(messageArray));
    }
    
    this.FormatTimeAsString = function (minutes, verbose) {
        //This formats minutes into days, hours and minutes
        var dayCount = 0;
        var hourCount = 0;
        var minuteCount = 0;
        var formattedTime = "";

        var dayString = "d";
        var hourString = "h";
        var minuteString = "min";

        if (verbose) {
            dayString = " day";
            hourString = " hour";
            minuteString = " minute";
        }

        dayCount = Math.floor(minutes / 1440);
        hourCount = Math.floor((minutes - dayCount * 1440) / 60);
        minuteCount = Math.floor(minutes % 60);

        //Formatting days (nothing for 0 days; 1 day; 2 days etc)
        if (dayCount > 0) formattedTime += dayCount + dayString;
        if (dayCount > 1 && verbose) formattedTime += "s";
        if (dayCount > 0 && (hourCount > 0 || minuteCount > 0)) {
            if (verbose) formattedTime += ",";
            formattedTime += " ";
        }

        //Formatting hours (nothing for 0 hours; 1 hour; 2 hours etc)
        if (hourCount > 0) formattedTime += hourCount + hourString;
        if (hourCount > 1 && verbose) formattedTime += "s";
        if (hourCount > 0 && minuteCount > 0) {
            if (verbose) formattedTime += ",";
            formattedTime += " ";
        }

        //Formatting minutes (nothing for 0 minutes; 1 minute; 2 minutes etc)
        if (minuteCount > 0) formattedTime += minuteCount + minuteString;
        if (minuteCount > 1 && verbose) formattedTime += "s";

        //Special case for a newly started TimeKeeper in a game
        if (minutes == 0) formattedTime = minutes + " minutes";

        return formattedTime;
    }

    this.ShowTimeAndExpiries = function (expiryArray) {
        //Send a whisper to the GM with the current time and all expiries
        var messageArray = [];
        messageArray.push("/w gm");
        messageArray.push("{{name=" + this.FormatTimeAsString(state.TimeKeeperGlobals.CurrentTime, true) + "}}");

        if (expiryArray !== undefined) {
            var remainingTime;
            var remainingAsString;
            var i;
            for (i = 0; i < expiryArray.length; i++) {
                if (this.HasExpired(expiryArray[i])) {
                    messageArray.push("{{" + expiryArray[i][0] + "'s " + expiryArray[i][1] + "=expired}}");
                }
                else {
                    remainingTime = parseInt(expiryArray[i][2]) - parseInt(state.TimeKeeperGlobals.CurrentTime);
                    remainingAsString = this.FormatTimeAsString(remainingTime, false);
                    messageArray.push("{{" + expiryArray[i][0] + "'s " + expiryArray[i][1] + "=" + remainingAsString + "}}");
                }
            }
        }

        sendChat(this.ChatName, this.BuildChatMessage(messageArray));
    }

    this.SetTime = function (minutes) {
        //Sets the current time to the desired minutes.
        if (minutes == "" || isNaN(minutes)) {
            var errorMessage = [];
            errorMessage[0] = minutes;
            errorMessage[1] = " is not a valid time.";
            this.SendErrorMessage(errorMessage);
            return false;
        }
        state.TimeKeeperGlobals.CurrentTime = parseInt(minutes);
        return true;
    }

    this.AddSubtractTime = function (minutes) {
        //Add a number of minutes to the current time. Adding negative values
        //subtracts minutes from the current time.
        if (minutes == "" || isNaN(minutes)) {
            var errorMessage = [];
            errorMessage[0] = minutes;
            errorMessage[1] = " is not a valid time.";
            this.SendErrorMessage(errorMessage);
            return false;
        }
        state.TimeKeeperGlobals.CurrentTime = parseInt(state.TimeKeeperGlobals.CurrentTime) + parseInt(minutes);
        return true;
    }

    this.AddExpiry = function (charName, effectName, duration) {
        //Creates a new expiry array of the format ["character name", "spell or effect name", time in minutes when the effect expires]
        if (charName == "" || effectName == "" || duration == "" || isNaN(duration)) {
            var errorMessage = [];
            errorMessage[0] = charName + "|" + effectName + "|" + duration;
            errorMessage[1] = " is not a valid expiry entry.";
            this.SendErrorMessage(errorMessage);

            return false;
        }

        var newExpiry = [charName, effectName, parseInt(state.TimeKeeperGlobals.CurrentTime) + parseInt(duration)];

        //Adds the newly created expiry array at the end of the global list of expiries
        state.TimeKeeperGlobals.Expiries.push(newExpiry);

        return true;
    }

    this.HasExpired = function (expiryItem) {
        //Checks whether a particular expiry item (an array) has expired
        
        //If the item has expired, i.e. the expiry time of the array entry is now or in the past
        if (parseInt(expiryItem[2]) <= parseInt(state.TimeKeeperGlobals.CurrentTime)) {
             return true;
        }

        return false;
    }

    this.SortExpiries = function () {
        //This compare function sorts the entries in the global expiries list by the expiry time, ascending
        if (state.TimeKeeperGlobals.Expiries.length > 0) {
            state.TimeKeeperGlobals.Expiries.sort(function (a, b) { return a[2] - b[2] });
        }
    }

    this.GetActiveExpiries = function () {
        //Returns an array of expiries that have not yet expired
        var newExpiryArray = [];

        //First, check if the global expiries array is empty. If so, just return without doing anything.
        if (state.TimeKeeperGlobals.Expiries.length == 0) {
            return newExpiryArray;
        }

        //This function loops through all the expiries in the global expiries array
        //For each one that has not yet expired, a new expiry entry is made in a local array
        var expiryCount = state.TimeKeeperGlobals.Expiries.length;
        var expiryIndex;
        for (expiryIndex = 0; expiryIndex < expiryCount; expiryIndex++) {
            if (this.HasExpired(state.TimeKeeperGlobals.Expiries[expiryIndex]) == false) {
                newExpiryArray.push(state.TimeKeeperGlobals.Expiries[expiryIndex]);
            }
        }

        return newExpiryArray;
    }
} 
		
on('ready', function () {
    var timeKeeper = new HappyTapir.TimeKeeper();
    timeKeeper.Initialize();
});


on("chat:message", function (msg) {
    //Parse the incoming message to see what needs to be done
    //Only API messages from the GM are recognized

    if (msg.type == "api" && playerIsGM(msg.playerid)) {
        var message = "";
        message = msg.content.trim();

        if (message.slice(0, 3) == "!tk") {
            var timeKeeper = new HappyTapir.TimeKeeper();
            
            if (message == "!tk") timeKeeper.ShowCommands();

            if (message.indexOf("!tk ") !== -1) {
                var msgArray = [];

                //Whisper the time and current expiries to the GM
                if (message.indexOf(" show") !== -1) {                    
                    timeKeeper.ShowTimeAndExpiries(state.TimeKeeperGlobals.Expiries);
                    //Update the expiries list with only active expiries
                    state.TimeKeeperGlobals.Expiries = timeKeeper.GetActiveExpiries();
                }

                //Set the time, then whisper current time and current expiries to the GM
                if (message.indexOf(" set ") !== -1) {
                    msgArray = message.split(" ", 3);
                    if (msgArray.length == 3) {
                        if (timeKeeper.SetTime(msgArray[2]) == true) {
                            timeKeeper.ShowTimeAndExpiries(state.TimeKeeperGlobals.Expiries);
                            //Update the expiries list with only active expiries
                            state.TimeKeeperGlobals.Expiries = timeKeeper.GetActiveExpiries();
                        }
                    }
                 }

                //Adjust the time, then whisper current time and current expiries to the GM
                if (message.indexOf(" add ") !== -1) {
                    msgArray = message.split(" ", 3);
                    if (timeKeeper.AddSubtractTime(msgArray[2]) == true) {
                        timeKeeper.ShowTimeAndExpiries(state.TimeKeeperGlobals.Expiries);
                        //Update the expiries list with only active expiries
                        state.TimeKeeperGlobals.Expiries = timeKeeper.GetActiveExpiries();
                    }
                }

                //Add expiry, sort the expiry list, and then provide feedback to the GM about the entered expiry
                if (message.indexOf(" exp ") !== -1) {
                    var expiryString = message.slice(7).trim();
                    msgArray = expiryString.split("|") //pipe symbol used here since it is unlikely to appear in character names
                    if (timeKeeper.AddExpiry(msgArray[0], msgArray[1], msgArray[2]) == true) {
                        timeKeeper.SortExpiries();
                        timeKeeper.ShowTimeAndExpiries(state.TimeKeeperGlobals.Expiries);
                    }
                }
            }
        }
    }
});
