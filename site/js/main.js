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
		link.setAttribute("href", "css/" + module_name + ".css");

		document.querySelector("head").appendChild(link);
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
		xhr.open('GET', 'templates/' + template_name + ".html");
		xhr.send();
	};











	//INSTREAM MODULE extends BASE MODULE
	var Instream = function(placeholder){
		//constructor....
		WidgetModule.apply(this,arguments);

		this.applyStyle("instream/main");
		this.loadTemplate("instream/choice");

		var voternator = document.createElement("voternator-main");
		voternator.innerHTML = "<voternator-tagline>Share your reaction! 25 votes already:</voternator-tagline";

		placeholder.parentNode.insertBefore(voternator, placeholder);

		this.element = voternator;
	};

	Instream.prototype = Object.create(WidgetModule.prototype);

	Instream.prototype.getData = function(){
		return [
			{
				symbol:"😂",
				score:5
			},
			{
				symbol:"😍",
				score:3
			},
			{
				symbol:"😱",
				score:9
			},
			{
				symbol:"😝",
				score:0
			},
			{
				symbol:"💩",
				score:8
			}
		];
	};

	Instream.prototype.generateChoice = function(config){
		var choice = this.templates["instream/choice"](config);

		var score = choice.querySelector("voternator-score");
		score.setAttribute(
			"style",
			"height:" + (score.getAttribute("data-numero") * 10) + "px;"
		);

		var button = choice.querySelector("voternator-button");
		button.addEventListener("click", function(){
			choice.classList.toggle("voted");
		});

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
		var widgets_script = document.querySelector("#freeman-voternator");
		if(widgets_script === null) return; //malformatted script

		var namespace = {
			instream: new Instream(widgets_script),
		};

		window._voternator = namespace;

		//now iterate through all the modules we initialized and run them all.
		for(var key in namespace){
			//run...
			namespace[key].namespace = namespace;
			setTimeout(function(){
				namespace[key].run();
			}, 1000);
		}

	})();


})();
