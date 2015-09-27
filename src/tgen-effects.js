(function (fn) {

	var tgen = window[fn];


	// fill a layer
	tgen.effect('fill', {
		blend: "",
		rgba:  [128, 128, 228, 0.5]
	}, function ($g, params) {

		$g.shape.rect($g, 1, 1, $g.texture.width, $g.texture.height);

		return params;

	});


	// one layer full copy to the current layer
	tgen.effect('copy', {
		"layer": null
	}, function ($g, params) {

		if (typeof params == 'number') {
			params = {"layer": params}
		}

		if (params.layer === null) {
			params.layer = $g.canvases.length - 1;
		}

		if ($g.canvases[params.layer] == undefined) {
			return params;
		}

		var pixels = $g.texture.pixels();
		var context = $g.canvases[params.layer].getContext('2d');
		var image = context.getImageData(0, 0, $g.texture.width, $g.texture.height);
		var imageData = image.data;

		while (pixels--) {
			$g.texture.data[pixels] = imageData[pixels];
		}

		return params;

	});


	// merge one or more layer
	tgen.effect('merge', {
		blend:   "opacity",
		opacity: 0.5,
		layer:   0
	}, function ($g, params) {


		if ($g.canvases[params.layer] === undefined) {
			return this;
		}

		var context = $g.canvases[params.layer].getContext('2d');
		var image = context.getImageData(0, 0, $g.texture.width, $g.texture.height);
		var imageData = image.data;

		for (var y = 0; y < $g.texture.height; y++) {
			for (var x = 0; x < $g.texture.width; x++) {

				var offset = $g.texture.offset(x, y);

				$g.point.rgba = [
					imageData[offset],
					imageData[offset + 1],
					imageData[offset + 2],
					imageData[offset + 3]
				];

				$g.point.rgba[3] = ($g.point.rgba[3] > 1) ? $g.point.rgba[3] / 255 : $g.point.rgba[3];
				$g.point.set(x, y);

			}
		}

		return params;

	});


	// noise
	tgen.effect('noise', {
		blend:   "softlight",
		mode:    'monochrome', // monochrome or color
		opacity: 0.5
	}, function ($g, params) {

		if (params.mode == 'color') {

			$g.walk(function (color) {
				color = [$g.randInt(0, 255), $g.randInt(0, 255), $g.randInt(0, 255), params.opacity];
				return color;
			});

		} else {

			$g.walk(function (color) {
				var rnd = $g.randInt(0, 255);
				color = [rnd, rnd, rnd, params.opacity];
				return color;
			});

		}

		return params;

	});


	// spheres
	tgen.effect('spheres', {
		blend:   "lighten",
		rgba:    "random",
		origin:  "random",
		dynamic: false,
		count:   21,
		size:    [20, 70]
	}, function ($g, params) {

		var elements = [];

		for (var i = 0; i < params.count; i++) {

			var xys = $g.xysize(i, params);
			$g.shape.sphere($g, $g.percentX(xys.x), $g.percentY(xys.y), $g.percentXY(xys.size), true, params.rgba, params.dynamic);
			elements.push(xys);

		}

		params.elements = elements;
		return params;

	});


	// pyramids
	tgen.effect('pyramids', {
		blend:   "lighten",
		rgba:    "random",
		origin:  "random",
		dynamic: false,
		count:   21,
		size:    [21, 100]
	}, function ($g, params) {

		var elements = [];

		for (var i = 0; i < params.count; i++) {

			var xys = $g.xysize(i, params);
			$g.shape.pyramid($g, $g.percentX(xys.x), $g.percentY(xys.y), $g.percentXY(xys.size), $g.percentXY(xys.size), true, params.rgba, params.dynamic);
			elements.push(xys);

		}

		params.elements = elements;
		return params;

	});


	// squares
	tgen.effect('squares', {
		blend:  "lighten",
		rgba:   "random",
		origin: "random",
		count:  [4, 7],
		size:   [2, 50]
	}, function ($g, params) {

		var elements = [];

		for (var i = 0; i < params.count; i++) {

			var xys = $g.xysize(i, params);

			$g.shape.rect($g, $g.percentX(xys.x), $g.percentY(xys.y), $g.percentXY(xys.size), $g.percentXY(xys.size), false);
			elements.push(xys);

		}

		params.elements = elements;
		return params;

	});


	// circles
	tgen.effect('circles', {
		blend:  "lighten",
		rgba:   "random",
		origin: "random",
		count:  21,
		size:   [1, 15]
	}, function ($g, params) {

		var elements = [];

		for (var i = 0; i < params.count; i++) {

			var xys = $g.xysize(i, params);
			$g.shape.circle($g, $g.percentX(xys.x), $g.percentY(xys.y), $g.percentXY(xys.size), true);
			elements.push(xys);

		}

		params.elements = elements;
		return params;

	});


	// lines
	tgen.effect('lines', {
		blend:  "opacity",
		rgba:   "random",
		size:   [100, 200],
		count:  [100, 400],
		freq1s: [21, 150],
		freq1c: [21, 150],
		freq2s: [21, 150],
		freq2c: [21, 150]
	}, function ($g, params) {

		params.freq1s = $g.randByArray(params.freq1s, true);
		params.freq1c = $g.randByArray(params.freq1c, true);
		params.freq2s = $g.randByArray(params.freq2s, true);
		params.freq2c = $g.randByArray(params.freq2c, true);
		params.size = $g.randByArray(params.size);

		for (var i = 0; i < params.count; i++) {

			var x1 = $g.texture.width / 2 + Math.sin(i / params.freq1s * $g.calc.pi) * params.size;
			var y1 = $g.texture.height / 2 + Math.cos(i / params.freq1c * $g.calc.pi) * params.size;
			var x2 = $g.texture.width / 2 + Math.sin(i / params.freq2s * $g.calc.pi) * params.size;
			var y2 = $g.texture.height / 2 + Math.cos(i / params.freq2c * $g.calc.pi) * params.size;

			$g.shape.line($g, x1, y1, x2, y2);

		}

		return params;

	});


	// lines2
	tgen.effect('lines2', {
		blend: ["opacity", "lighten", "screen"],
		rgba:  "random",
		type:  "vertical",
		size:  [0.1, 11],
		count: [4, 21]
	}, function ($g, params) {

		var elements = [];
		var item = null;

		for (var i = 0; i < params.count; i++) {

			if (params.elements != undefined) {

				item = params.elements[i];

			} else {

				item = {
					size: $g.randByArray(params.size, true),
					d:    $g.randReal(0.1, 100)
				}

			}

			if (params.type == 'vertical') {
				$g.shape.rect($g, $g.percentX(item.d), 0, $g.percentX(item.size), $g.texture.height);
			} else {
				$g.shape.rect($g, 0, $g.percentX(item.d), $g.texture.width, $g.percentX(item.size));
			}

			elements.push(item);

		}

		params.elements = elements;
		return params;

	});


	// subplasma - aDDict2
	tgen.effect('subplasma', {
		seed: [1, 65535],
		size: [3, 4],
		rgba: "random"
	}, function ($g, params) {

		params.seed = $g.randByArray(params.seed);
		params.size = $g.randByArray(params.size);
		$g.calc.randomseed(params.seed);

		var np = 1 << params.size;
		var rx = $g.texture.width;
		var ry = rx;
		var buffer = [];
		var x, y;

		if (np > rx) {
			np = rx;
		}

		var ssize = rx / np;

		for (y = 0; y < np; y++) {
			for (x = 0; x < np; x++) {
				buffer[x * ssize + y * ssize * rx] = $g.calc.randomseed();
			}
		}

		for (y = 0; y < np; y++) {
			for (x = 0; x < rx; x++) {
				var p = x & (~(ssize - 1));
				var zy = y * ssize * rx;
				buffer[x + zy] = $g.calc.interpolate.catmullrom(
					buffer[((p - ssize * 1) & (rx - 1)) + zy],
					buffer[((p - ssize * 0) & (rx - 1)) + zy],
					buffer[((p + ssize * 1) & (rx - 1)) + zy],
					buffer[((p + ssize * 2) & (rx - 1)) + zy],
					x % ssize, ssize);
			}
		}

		for (y = 0; y < ry; y++) {
			for (x = 0; x < rx; x++) {
				var p = y & (~(ssize - 1));
				buffer[x + y * rx] = $g.calc.interpolate.catmullrom(
					buffer[x + ((p - ssize * 1) & (ry - 1)) * rx],
					buffer[x + ((p - ssize * 0) & (ry - 1)) * rx],
					buffer[x + ((p + ssize * 1) & (ry - 1)) * rx],
					buffer[x + ((p + ssize * 2) & (ry - 1)) * rx],
					y % ssize, ssize);
			}
		}

		// colorize
		for (x = 0; x < $g.texture.width; x++) {
			for (y = 0; y < $g.texture.height; y++) {

				var color = 256 * buffer[x + y * rx];
				$g.point.rgba = $g.point.colorize(params.rgba, [color, color, color, 1]);
				$g.point.set(x, y);

			}
		}

		return params;

	});


	// waves
	tgen.effect('waves', {
		blend:  "opacity",
		rgba:   "random",
		level:  50,
		xsines: [1, 10],
		ysines: [1, 10]
	}, function ($g, params) {


		if (params.xsines === undefined) {
			params.xsines = $g.randInt(1, 10);
		} else if (typeof params.xsines == 'object') {
			params.xsines = $g.randInt(params.xsines[0], params.xsines[1]);
		}

		if (params.ysines === undefined) {
			params.ysines = $g.randInt(1, 10);
		} else if (typeof params.ysines == 'object') {
			params.ysines = $g.randInt(params.ysines[0], params.ysines[1]);
		}

		if (params.rgba === undefined) {
			var o = (params.opacity !== undefined) ? params.opacity : 1;
			params.rgba = $g.rgba([
				[0, 255],
				[0, 255],
				[0, 255],
				o
			]);
		}


		for (var x = 0; x < $g.texture.width; x++) {
			for (var y = 0; y < $g.texture.height; y++) {

				var c = 127 + 63.5 * Math.sin(x / $g.texture.width * params.xsines * 2 * $g.calc.pi) + 63.5 * Math.sin(y / $g.texture.height * params.ysines * 2 * $g.calc.pi);
				if (typeof params.channels == "object") {
					$g.point.rgba = [params.channels[0] ? c : 0, params.channels[1] ? c : 0, params.channels[2] ? c : 0, params.channels[3] ? c : 0];
				} else {
					$g.point.rgba = $g.point.colorize([c, c, c, 1], params.rgba, params.level);
				}

				$g.point.set(x, y);

			}
		}

		return params;

	});


	// crosshatch
	tgen.effect('crosshatch', {
		blend: "random",
		level: 50
	}, function ($g, params) {


		if (params.xadjust == undefined) {
			params.xadjust = $g.randInt(1, 10);
		}
		if (params.yadjust === undefined) {
			params.yadjust = $g.randInt(1, 10);
		}
		if (params.rgba === undefined) {
			params.rgba = [$g.randInt(0, 255), $g.randInt(0, 255), $g.randInt(0, 255), 1];
		}


		for (var x = 0; x < $g.texture.width; x++) {
			for (var y = 0; y < $g.texture.height; y++) {

				var c = 127 + 63.5 * Math.sin(x * x / params.xadjust) + 63.5 * Math.cos(y * y / params.yadjust);
				$g.point.rgba = $g.point.colorize([c, c, c, 1], params.rgba, params.level);
				$g.point.set(x, y);

			}
		}


		return params;

	});


	// map effect - aDDict2
	tgen.effect('map', {
		xamount:  [5, 255],
		yamount:  [5, 255],
		xchannel: [0, 3], // 0=r, 1=g, 2=b, 3=a
		ychannel: [0, 3], // 0=r, 1=g, 2=b, 3=a
		xlayer:   0,
		ylayer:   0
	}, function ($g, params) {

		params.xamount = $g.randByArray(params.xamount);
		params.yamount = $g.randByArray(params.yamount);
		params.xchannel = $g.randByArray(params.xchannel);
		params.ychannel = $g.randByArray(params.ychannel);
		params.xlayer = $g.randByArray(params.xlayer);
		params.ylayer = $g.randByArray(params.ylayer);

		var buffer = new $g.buffer();

		var width = $g.texture.width;
		var height = $g.texture.height;

		var xcontext = $g.canvases[params.xlayer].getContext('2d');
		var ximage = xcontext.getImageData(0, 0, width, height);
		var ximageData = ximage.data;

		var ycontext = $g.canvases[params.ylayer].getContext('2d');
		var yimage = ycontext.getImageData(0, 0, width, height);
		var yimageData = yimage.data;


		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {

				var offset = $g.texture.offset(x, y);
				var sx = ximageData[offset + params.xchannel];
				var sy = yimageData[offset + params.ychannel];

				if ((width % 16) == 0) {
					var ox = $g.wrapx(x + ((sx * params.xamount * width) >> 16));
				} else {
					var ox = x + ((sx * params.xamount * width) / (width * width));
				}

				if ((height % 16) == 0) {
					var oy = $g.wrapy(y + ((sy * params.yamount * height) >> 16));
				} else {
					var oy = y + ((sy * params.yamount * height) / (height * height));
				}

				var rgba = $g.point.get(ox, oy);

				buffer.data[offset] = rgba[0];
				buffer.data[offset + 1] = rgba[1];
				buffer.data[offset + 2] = rgba[2];
				buffer.data[offset + 3] = rgba[3];

			}
		}

		var pixels = $g.texture.pixels();
		while (pixels--) {
			$g.texture.data[pixels] = buffer.data[pixels];
		}

		return params;

	});


	// clouds - midpoint displacement
	tgen.effect('clouds', {
		blend:     "opacity",
		rgba:      "random",
		seed:      [1, 65535],
		roughness: [2, 16]
	}, function ($g, params) {


		params.seed = $g.randByArray(params.seed);
		params.roughness = $g.randByArray(params.roughness);

		var width = $g.texture.width;
		var height = $g.texture.height;


		var map = [];
		var generateMap = function () {
			for (var x = 0; x <= width; x++) {
				map[x] = [];
				for (var y = 0; y <= height; y++) {
					map[x][y] = 0;
				}
			}
		}

		var mapV = function (x, y, value) {

			if (x < 0) {
				x = width + x;
			}

			if (x >= width) {
				x = x - width;
			}

			if (y < 0) {
				y = height + y;

			}

			if (y >= height) {
				y = y - height;
			}

			if (value !== undefined) {
				return map[x][y] = value;
			} else {
				return map[x][y];
			}

		}

		var displace = function (num) {
			return ($g.calc.randomseed() - 0.5) * (num / (width + width) * params.roughness);
		}

		var generateCloud = function (step) {

			var stepHalf = step / 2;
			if (stepHalf <= 1) {
				return params;
			}

			for (var i = stepHalf - stepHalf; i <= (width + stepHalf); i += stepHalf) {
				for (var j = stepHalf - stepHalf; j <= (height + stepHalf); j += stepHalf) {

					var topLeft = mapV(i - stepHalf, j - stepHalf);
					var topRight = mapV(i, j - stepHalf);
					var bottomLeft = mapV(i - stepHalf, j);
					var bottomRight = mapV(i, j);

					var x = i - (stepHalf / 2);
					var y = j - (stepHalf / 2);

					// center
					var center = mapV(x, y, $g.calc.normalize1((topLeft + topRight + bottomLeft + bottomRight) / 4 + displace(step)));

					// left
					var xx = i - (step) + (stepHalf / 2);
					mapV(i - stepHalf, y, $g.calc.normalize1((topLeft + bottomLeft + center + mapV(xx, y)) / 4 + displace(step)));

					// top
					var yy = j - (step) + (stepHalf / 2);
					mapV(x, j - stepHalf, $g.calc.normalize1((topLeft + topRight + center + mapV(x, yy)) / 4 + displace(step)));

				}

			}

			generateCloud(stepHalf);

		}

		// init random seeder
		$g.calc.randomseed(params.seed);

		// generate empty map
		generateMap();

		// generate cloud
		generateCloud(width);

		// colorize
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {

				var color = 256 * map[x][y];
				$g.point.rgba = $g.point.colorize(params.rgba, [color, color, color, 1]);
				$g.point.set(x, y);

			}
		}

		return params;

	});


})('tgen');