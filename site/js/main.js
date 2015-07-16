NodeList.prototype.forEach = Array.prototype.forEach;

(function(){

	//THE VOTERNATOR
	//@author nabil freeman github.com/nabilfreeman


	//TEMPLATES
	var Templates = function(){
		this._templates = {
			"instream/choice": '<voternator-choice data-choice-id="{{choice}}"><voternator-score data-numero="{{score}}"></voternator-score><voternator-tap ontouchstart><div class="voternator-emoji" style="background-image:url({{endpoint}}/img/symbols/{{content}}.png)"></div></voternator-tap></voternator-choice>'
		}
	};

	Templates.prototype.load = function(template_name){
		var self = this;

		return function(config){
			var victim = self._templates[template_name];

			for(var key in config){
				var re = new RegExp("{{" + key.toString() + "}}", "g");
				victim = victim.replace(re, config[key]);
			}

			var temp = document.createElement("div");
			temp.innerHTML = victim;

			return temp.firstChild;
		}
	}

	Templates.prototype.run = function(){};





	//BASE CLASS
	var WidgetModule = function(){};

	WidgetModule.prototype.error = function(){
		console.log(arguments);
	};

	WidgetModule.prototype.applyStyle = function(module_name){
		//init stylesheet
		var link = document.createElement("link");
		link.setAttribute("rel", "stylesheet");
		link.setAttribute("href", this.resources_endpoint + "/css/" + module_name + ".css");

		document.querySelector("head").appendChild(link);
	};

	WidgetModule.prototype.customColor = function(module_name, color){
		var self = this;

		if(!this.themes) this.themes = {};

		var addStyleSheet = function(victim){
			var previous_style = document.querySelector("#voternator-custom-color-" + module_name);

			var re = new RegExp("{{color}}", "g");
			victim = victim.replace(re, color);

			var style = document.createElement("style");
			style.id = "voternator-custom-color-" + module_name;
			style.type = "text/css";

			if (style.styleSheet){
				style.styleSheet.cssText = victim;
			} else {
				style.appendChild(document.createTextNode(victim));
			}

			document.head.appendChild(style);

			if(previous_style){
				previous_style.parentNode.removeChild(previous_style);
			}
		}

		if(this.themes && this.themes[module_name]){
			addStyleSheet(this.themes[module_name]);

			return;
		}

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {

			if (xhr.readyState === 4) {
				self.themes[module_name] = xhr.responseText;
				addStyleSheet(xhr.responseText);
			}

		};
		xhr.open('GET', this.resources_endpoint + '/css/' + module_name + "/color.css");
		xhr.send();
	};






	//INSTREAM MODULE extends BASE MODULE
	var Instream = function(placeholder, api_endpoint, resources_endpoint){
		//constructor....
		WidgetModule.apply(this,arguments);

		this.api_endpoint = api_endpoint;
		this.resources_endpoint = resources_endpoint;

		this.applyStyle("instream/main");

		var color = placeholder.getAttribute("color");
		if(color){
			this.customColor("instream", color);
		}

		var voternator = document.createElement("voternator-main");
		voternator.innerHTML = "<voternator-tagline>What's your reaction?</voternator-tagline";

		placeholder.parentNode.insertBefore(voternator, placeholder);

		this.element = voternator;
	};

	Instream.prototype = Object.create(WidgetModule.prototype);

	Instream.prototype.getData = function(){

		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.api_endpoint + '/votes', false);
		xhr.send(null);

		if (xhr.status === 200) {
			var obj = JSON.parse(xhr.responseText);

			return obj.data;
		} else {
			return [];
		}

	};

	Instream.prototype.upvote = function(id){
		var xhr = new XMLHttpRequest();
		xhr.open('POST', this.api_endpoint + '/vote/up');
		xhr.send("choice=" + id);
	};

	Instream.prototype.downvote = function(id){
		var xhr = new XMLHttpRequest();
		xhr.open('POST', this.api_endpoint + '/vote/down');
		xhr.send("choice=" + id);
	}

	Instream.prototype.generateChoice = function(config){
		var self = this;

		config.endpoint = this.resources_endpoint;

		var choice = this.namespace.templates.load("instream/choice")(config);

		var score = choice.querySelector("voternator-score");
		score.setAttribute(
			"style",
			"height:" + (score.getAttribute("data-numero") * 30) + "px;"
		);

		if(score.getAttribute("data-numero") == 0){
			score.setAttribute("data-numero", "");
		}

		var voted = false;

		var button = choice.querySelector("voternator-tap");

		var handler =  function(e){
			e.preventDefault();

			if(voted){
				choice.classList.remove("voted");
				config.score -= 1;

				self.downvote(choice.getAttribute("data-choice-id"));
			} else {
				choice.classList.add("voted");
				config.score += 1;

				self.upvote(choice.getAttribute("data-choice-id"));
			}

			voted = !voted;

			score.setAttribute("data-numero", config.score);
			score.setAttribute(
				"style",
				"height:" + (score.getAttribute("data-numero") * 30) + "px;"
			);

			if(score.getAttribute("data-numero") == 0){
				score.setAttribute("data-numero", "");
			}

			if(self.namespace.ga !== undefined){
				self.namespace.ga.trackEvent("voternator", "voted", {
					symbol: config.content
				});
			}

		};

		button.addEventListener("touchstart", handler);
		button.addEventListener("click", handler);

		return choice;
	};

	Instream.prototype.run = function(){
		//run.....
		var self = this;

		var table = document.createElement("voternator-table");

		var data = this.getData();
		data.forEach(function(choice){
			table.appendChild(self.generateChoice(choice));
		});

		this.element.appendChild(table);
	};





	var GA = function() {
		WidgetModule.apply(this,arguments);

		this._account = "UA-65231671-1";
		this._name = 'the_voternator';
		this._ga = 'ga_' + this._name;

	};

	GA.prototype = Object.create(WidgetModule.prototype); // inherit

	GA.prototype.run = function() {

		//Analytics.js is a little messy. GoogleAnalyticsObject is a global that can take a custom name.
		//It might be window.ga, window.foo, window.themag, etc.
		//We don't want to overwrite that so check if it exists, use it if so (to not break partner sites),
		//and set it 'ga' as default if not set.
		window.GoogleAnalyticsObject = window.GoogleAnalyticsObject || this._ga;
		this._ga = window.GoogleAnalyticsObject;

		this._endpoint = '//www.google-analytics.com/analytics.js';

		//if load script if not loaded otherwise continue
		if (window[this._ga] === undefined) {
			this._load();
		}else{
			this._loaded();
		}

	};

	GA.prototype._loaded = function(){
		//console.log("_loaded",this);
		var ga = this._ga;
		window[ga]('create', this._account, 'auto', {
			'name': this._name
		});
		window[ga](this._name+'.require', 'displayfeatures');
		window[ga](this._name+'.send', 'pageview');
	};

	GA.prototype._load = function(){
		//now see GA is already loaded on the page
		var target = this._endpoint;
		var ga = this._ga;
		window[ga] = window[ga] || function(){
			(window[ga].q = window[ga].q || []).push(arguments);
		};
		//console.log("_load",this);
		var self = this;
		//For info: There used to be a comma above here instead of semicolon.
		window[ga].l = (new Date()).getTime();

		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = target;
		script.async = true;
		script.onload = function(){
			self._loaded();
		};

		document.head.appendChild(script);
	};

	GA.prototype.trackEvent = function(category, action, label, extras){
		var ga = this._ga;
		var args = [this._name+'.send', 'event', category, action];
		if(extras !== undefined){
			args.push('extras');
			args.push(JSON.stringify(extras));
		}
		window[ga].apply(this, args);
	};








	//INITIALIZE
	(function(){
		var widgets_script = document.querySelector("#the-voternator");
		if(widgets_script === null) return; //malformatted script

		var api_endpoint = "https://voternator-nfrmn.rhcloud.com"; //production
		var resources_endpoint = "https://s3.amazonaws.com/the-voternator-resources"; //production
		// var api_endpoint = "http://localhost:8000"; //dev
		// var resources_endpoint = ""; //dev

		var namespace = {
			instream: new Instream(widgets_script, api_endpoint, resources_endpoint),
			ga: new GA(),
			templates: new Templates()
		};

		window._voternator = namespace;

		//now iterate through all the modules we initialized and run them all.
		for(var key in namespace){
			//run...
			namespace[key].namespace = namespace;
			namespace[key].run();
		}

	})();


})();
