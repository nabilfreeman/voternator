NodeList.prototype.forEach = Array.prototype.forEach;

(function(){

	//THE VOTERNATOR
	//@author nabil freeman github.com/nabilfreeman

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

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {

			if (xhr.readyState === 4) {
				var victim = xhr.responseText;
				var re = new RegExp("{{color}}", "g");
				victim = victim.replace(re, color);

				var style = document.createElement("style");
				style.id = "voternator-custom-color";
				style.type = "text/css";

				if (style.styleSheet){
					style.styleSheet.cssText = victim;
				} else {
					style.appendChild(document.createTextNode(victim));
				}

				document.head.appendChild(style);
			}

		};
		xhr.open('GET', this.resources_endpoint + '/css/' + module_name + "/color.css", false);
		xhr.send();
	};

	WidgetModule.prototype.loadTemplate = function(template_name){
		var self = this;

		if(!this.templates) this.templates = {};

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				self.templates[template_name] = function(config){
					var victim = xhr.responseText;

					for(var key in config){
						var re = new RegExp("{{" + key.toString() + "}}", "g");
						victim = victim.replace(re, config[key]);
					}

					var temp = document.createElement("div");
					temp.innerHTML = victim;

					return temp.firstChild;
				};
			}
		};
		xhr.open('GET', this.resources_endpoint + '/templates/' + template_name + ".html", false);
		xhr.send();
	};











	//INSTREAM MODULE extends BASE MODULE
	var Instream = function(placeholder, api_endpoint, resources_endpoint){
		//constructor....
		WidgetModule.apply(this,arguments);

		this.api_endpoint = api_endpoint;
		this.resources_endpoint = resources_endpoint;

		this.applyStyle("instream/main");
		this.loadTemplate("instream/choice");

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

		var choice = this.templates["instream/choice"](config);

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
