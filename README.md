# TimeKeeper
Roll20 API script which tracks time and expiries. The GM advances the time; there is no automatic advancement of time.

Current commands (version 0.1):
<ul>
  <li>!tk - shows commands.</li>
  <li>!tk show - displays current time.</li>
  <li>!tk set X - sets current time to X minutes.</li>
  <li>!tk add X - adds X minutes to the current time. Use negative values to subtract time.</li>
  <li>!tk exp charactername|effect|duration - adds an expiry effect for charactername with a duration in minutes. Example: !tk exp Delgon the Dwarf|Battle Rage|10 will add and track the expiry of the Battle Rage for Delgon the Dwarf. The Battle Rage will expire in 10 minutes from the time it was added.</li>
</ul>
