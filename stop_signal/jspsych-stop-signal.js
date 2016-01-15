/**
* jspsych-stop-signal
* Ian Eisenberg
*
* plugin for displaying a stimulus and getting a keyboard response
*
* documentation: docs.jspsych.org
*
**/

jsPsych.plugins["stop-signal"] = (function() {

	var plugin = {};

	jsPsych.pluginAPI.registerPreload('stop-signal', 'stimulus', 'image');

	plugin.trial = function(display_element, trial) {

		// if any trial variables are functions
	    // this evaluates the function and replaces
	    // it with the output of the function
	    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

		trial = {};
		trial.choices = params.choices || [];
		trial.response_ends_trial = (typeof params.response_ends_trial === 'undefined') ? true : params.response_ends_trial;
		trial.SS_stimulus = params.SS_stimulus[i];
		trial.SS_trial_type = params.SS_trial_type[i] // 'stop' or 'go'
		// timing parameters
		trial.timing_stim = params.timing_stim || -1; // if -1, then show indefinitely
		trial.timing_SS = params.timing_SS || -1; // if -1, then show indefinitely
		trial.timing_response = params.timing_response || -1; // if -1, then wait for response forever
		trial.SSD = params.SSD || -1
		// optional parameters
		trial.is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
		trial.prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;
		// if any trial variables are functions
		// this evaluates the function and replaces
		// it with the output of the function
		trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

		// this array holds handlers from setTimeout calls
		// that need to be cleared if the trial ends early
		var setTimeoutHandlers = [];

		// display stimulus
		if (!trial.is_html) {
			display_element.append($('<img>', {
				src: trial.stimulus,
				id: 'jspsych-stop-signal-stimulus'
			}));
		} else {
			display_element.append($('<div>', {
				html: trial.stimulus,
				id: 'jspsych-stop-signal-stimulus'
			}));
		}

		//show prompt if there is one
		if (trial.prompt !== "") {
			display_element.append(trial.prompt);
		}

		// store response
		var response = {rt: -1, key: -1};

		// function to end trial when it is time
		var end_trial = function() {

			// kill any remaining setTimeout handlers
			for (var i = 0; i < setTimeoutHandlers.length; i++) {
				clearTimeout(setTimeoutHandlers[i]);
			}

			// kill keyboard listeners
			if(typeof keyboardListener !== 'undefined'){
				jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
			}

			// gather the data to store for the trial
			var trial_data = {
				"rt": response.rt,
				"SSD_stimulus": trial.SS_stimulus,
				"key_press": response.key,
				"SSD": trial.SSD,
				"SS_trial_type": trial.SS_trial_type
			};

			jsPsych.data.write(trial_data);

			// clear the display
			display_element.html('');

			// move on to the next trial
			jsPsych.finishTrial();
		};

		// function to handle responses by the subject
		var after_response = function(info) {

			// after a valid response, the stimulus will have the CSS class 'responded'
			// which can be used to provide visual feedback that a response was recorded
			$("#jspsych-stop-signal-stimulus").addClass('responded');

			// only record the first response
			if(response.key == -1){
				response = info;
			}

			if (trial.response_ends_trial) {
				end_trial();
			}
		};

		// start the response listener
		if(JSON.stringify(trial.choices) != JSON.stringify(["none"])) {
			var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
				callback_function: after_response,
				valid_responses: trial.choices,
				rt_method: 'date',
				persist: false,
				allow_held_key: false
			});
		}

		// hide image if timing is set
		if (trial.timing_stim > 0) {
			var t1 = setTimeout(function() {
				$('#jspsych-stop-signal-stimulus').css('visibility', 'hidden');
			}, trial.timing_stim);
			setTimeoutHandlers.push(t1);
		}

		// end trial if time limit is set
		if (trial.timing_response > 0) {
			var t2 = setTimeout(function() {
				end_trial();
			}, trial.timing_response);
			setTimeoutHandlers.push(t2);
		}
		
		if (trial.SS_trial_type.toLowerCase() == 'stop') {
			// end trial if time limit is set
			if (trial.SSD >= 0) {
				var t3 = setTimeout(function() {
					display_element.append($('<div>', {
						html: trial.SS_stimulus,
						id: 'jspsych-stop-signal-SS'
					}));
				}, trial.SSD);
				setTimeoutHandlers.push(t3);
			}
		
			// hide SS after a fixed interval (or when stimulus ends)
			if (trial.timing_SS > 0) {
				var t4 = setTimeout(function() {
					$('#jspsych-stop-signal-SS').css('visibility', 'hidden');
				}, trial.timing_SS+trial.SSD);
				setTimeoutHandlers.push(t4);
			}
		}

	};

	return plugin;
})();
