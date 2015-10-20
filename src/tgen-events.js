(function (fn) {

	var tgen = window[fn];

	var time;
	var fulltime;

	tgen.event('beforeEffect', 'save start time', function ($g, effect) {
		time = new Date().getTime();
	});

	tgen.event('afterEffect', 'log', function ($g, effect) {

		var elapsed = new Date().getTime() - time;
		console.log(effect.layer, elapsed, effect.name, effect.params);

	});

	tgen.event('beforeRender', 'log', function ($g, params) {
		fulltime = new Date().getTime();
	});

	tgen.event('afterRender', 'log', function ($g, params) {

		var elapsed = new Date().getTime() - fulltime;
		console.log(elapsed, params);

	});


})('tgen');