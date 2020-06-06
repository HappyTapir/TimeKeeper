# TimeKeeper
Roll20 API script which tracks time and expiries. The time and expiries persist and are tracked between sessions. The GM advances the time; there is no automatic advancement of time. The script currently communicates only with the GM.

Current commands (version 0.2.0):
<ul>
  <li>!tk - shows commands.</li>
  <li>!tk show - displays current time.</li>
  <li>!tk set X - sets current time to X minutes.</li>
  <li>!tk add X - adds X minutes to the current time. Use negative values to subtract time.</li>
  <li>!tk exp charactername|effect|duration - adds an expiry effect for charactername with a duration in minutes. Example: !tk exp Delgon the Dwarf|Battle Rage|10 will add and track the expiry of the Battle Rage for Delgon the Dwarf. The Battle Rage will expire in 10 minutes from the time it was added.</li>
</ul>

# How do I...?
How do I set the time to be 1 day, 2 hours and 4 minutes? The script stores the current time in minutes, so in order to set the time, or add time, you have to first calculate how many minutes to add. For example, setting the time to 1 day, 2 hours and 4 minutes would be done with the command <i>!tk set 1564</i>, where the calculation would have been 1440 + 120 + 4 minutes = 1564. See the macros below for one that will help you easily do this calculation.

# Suggested Macros
These are some convenient macros to utilize the script:
<table>
  <tr>
    <td><b>Macro Text</b></td><td><b>Purpose and Comments</b></td>
  </tr>
  <tr>
    <td>!tk show</td><td>Displays the current time.</td>
  </tr>
  <tr>
    <td>!tk add 10</td><td>Adds 10 minutes to the current time.</td>
  </tr>
  <tr>
    <td>!tk exp @{selected|token_name}|?{Ability, effect or spell}|?{Duration in minutes}</td><td>This macro is meant to be used as a Token Action. Adds an expiry for the character whose token was selected.</td>
  </tr>
  <tr>
    <td>/w gm [[?{Days|0}*1440 + ?{Hours|0}*60 + ?{Minutes|0}]]</td><td>A simple macro to convert times from days, hours and minutes into minutes. I use this to calculate larger time values for adding or setting.</td>
  </tr>
  </table>
  
# Version History
<ul>
  <li>0.1 First public release</li>
  <li>0.1.1 Minor formatting changes. No changes in functionality.</li>
  <li>0.1.2 Changed method of determining whether commands are sent by GM.</li>
  <li>0.1.3 Added handling of incorrect inputs, with feedback in case an invalid time or expiry entry is attempted.</li>
  <li>0.2.0 Recoded. Added formatting using the Roll20 default template. Overall output is less verbose and less spammy (hopefully).</li>
</ul>
  
