var test3D,
  texture,
  editor,
  presets = [];
var urlparams = {},
  hash;
var q = document.URL.split("?")[1];

if (q != undefined) {
  q = q.split("&");
  for (var i = 0; i < q.length; i++) {
    hash = q[i].split("=");
    urlparams[hash[0]] = hash[1];
  }
}

$(document).ready(function () {
  texture = tgen.init();

  for (var name in tgen.presets) {
    presets.push(name);
    $("#presets").append($("<option></option>").attr("value", name).text(name));
  }

  $(".tgen-version").html("v" + tgen.version);

  editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.$blockScrolling = Infinity;
  editor.getSession().setMode("ace/mode/javascript");

  $(".editor").on("click", function () {
    $("#panel").toggleClass("show");
  });

  $(".generate").on("click", function () {
    generate();
  });

  $(".3d").on("click", function () {
    if ($("body").hasClass("test3d")) {
      $("#three").html("");
      $("body").removeClass("test3d");
      test3D.stop();
    } else {
      $("body").addClass("test3d");
      test3D.start();
    }
  });

  $("#three").on("click", function () {
    test3D.sceneNumber = test3D.sceneNumber == 1 ? 2 : 1;
  });

  $("#presets").on("change", function (v) {
    var preset = $(this).val();
    paramsToEditor(preset);

    if (history.pushState) {
      var newurl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname +
        "?preset=" +
        preset;
      window.history.pushState({ path: newurl }, "", newurl);
    }
  });

  // $('.preset').each(function() {
  //     var id = $(this).attr('id');
  //     var title = $(this).attr('title');
  //     presets.push(id);
  //     $('#presets').append($("<option></option>").attr("value", id).text(title));
  // });

  var paramsToEditor = function (id) {
    if (id == "editor") {
      return;
    }

    if (!tgen.presets[id]) {
      return;
    }

    var preset = tgen.presets[id];
    editor.setValue(JSON.stringify(preset));

    var beautify = ace.require("ace/ext/beautify");
    beautify.beautify(editor.session);
  };

  var editorToParams = function () {
    var preset = $("#presets").val();

    if (preset == "random") {
      presets = Object.keys(tgen.presets);
      count = presets.length;
      var index = Math.floor(Math.random() * (count - 1));
      paramsToEditor(presets[index]);
    }

    var params = editor.getValue();

    if (!params) {
      return null;
    }

    return params.replace(/(var\sparams\s=\s|\s|\r\n|\r|\n)/gm, "");
  };

  // var updateHistory = function () {
  //   var history = texture.history.list();
  //   $("#history").html("");
  //   $("#history").append($("<option></option>").attr("value", 0).text(""));

  //   for (var id in history) {
  //     var name = history[id].name;
  //     $("#history").append($("<option></option>").attr("value", id).text(name));
  //   }
  // };

  // $("#history").on("change", function () {
  //   $("#panel").addClass("show");
  //   $("#presets").val("editor");
  //   var params = texture.history.get($(this).val());
  //   editor.setValue(JSON.stringify(params, null, 2));
  //   generate();
  // });

  $(".ace_text-input").keydown(function (e) {
    if (e.ctrlKey && e.keyCode == 13) {
      $("#presets").val("editor");
      generate();
    }
  });

  $(".phases, #gallery").on("click", "img", function () {
    $("#presets").val("editor");
    var params = $(this).attr("params");
    params = JSON.parse(params);
    params = JSON.stringify(params, null, 2);

    var src = $(this).attr("src");
    $("body").css("background-image", "url(" + src + ")");

    editor.setValue(params);

    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function () {
      test3D.updateCanvas(image);
    };
    image.src = src;
  });

  var message = function (msg, timeout) {
    if (msg == "") {
      $("body").removeClass("msg");
    } else {
      $("body").addClass("msg");
    }

    $(".message").text(msg);

    if (timeout !== undefined) {
      setTimeout(function () {
        $("body").removeClass("msg");
        $(".message").text("");
      }, timeout);
    }
  };

  $(".upload, .sure .cancel").on("click", function () {
    $(".sure").toggleClass("show");
  });

  // upload to gallery
  $(".sure .ok").on("click", function () {
    $("body").addClass("uploading");
    $(".sure").removeClass("show");
    message("Uploading...");

    editor = JSON.parse(editorToParams());
    var data = {
      id: editor.id ? editor.id : null,
      params: texture.params(),
      pngdata: texture.toCanvas().toDataURL("image/octet-stream"),
    };

    $.ajax({
      type: "POST",
      url: "https://texture-generator.com/api/texture/upload",
      dataType: "json",
      data: JSON.stringify(data),
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      success: function (res) {
        $("body").removeClass("uploading");

        if (res.status !== "success") {
          if (res.statusCode === "error.duplicated") {
            message("Duplicated texture, upload skipped");
          } else {
            message(res.statusCode);
          }
        } else {
          message("Uploading OK");
        }

        message("", 3500);
      },
      false: function () {
        message("Unknown upload error", 3500);
      },
    });
  });

  var offset = 0;
  var limit = 50;

  var loadGallery = function (offset, limit) {
    message("Loading...");

    $.ajax({
      type: "GET",
      url: "https://texture-generator.com/api/texture/gallery",
      data: {
        offset: offset,
        limit: limit,
      },
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      success: function (res) {
        if (res.status !== "success") {
          message(res.statusCode, 3500);
          return;
        }

        message("", 200);
        $("#gallery").addClass("loaded");

        for (i in res.data) {
          var item = res.data[i];
          var img = $(
            '<span class="frame"><img params=\'' +
              item.params +
              "' src=\"" +
              item.image +
              '"><span class="text">' +
              item.id +
              "</span></span>"
          );
          //img.appendTo("#gallery .images");
        }
      },
      false: function () {
        message("Unknown gallery error", 3500);
      },
    });
  };

  $("#loadmore").on("click", function () {
    offset = offset + limit;
    loadGallery(offset, limit);
  });

  // show the gallery
  $(".gallery").on("click", function () {
    if ($("body").hasClass("galleryon")) {
      $("body").removeClass("galleryon");
      return;
    }

    $("body").addClass("galleryon");

    if ($("#gallery").hasClass("loaded")) {
      return;
    }

    loadGallery(offset, limit);
  });

  //updateHistory();

  var times = [];
  var count = 0;

  var generate = function () {
    if ($("body").hasClass("rendering")) {
      //console.log("Already running")
      //return;
    }

    $("body").addClass("rendering");
    message("Generating...");

    var to = setTimeout(function () {
      try {
        var params = JSON.parse(editorToParams());
        params.debug = true;

        texture.render(params, function (event, data) {
          console.log(event, data);
        });

        texture.stat(function (time) {
          times.push(time.elapsed);
          var sum = 0;

          for (var key in times) {
            sum += times[key];
          }

          $(".rendercount").text(++count);
          $(".rendertime").text(time.elapsed);
          $(".averagetime").text(Math.round((sum / times.length) * 100) / 100);
        });

        texture.getCanvas(function (texture_canvas) {
          $("body").css(
            "background-image",
            "url(" + texture_canvas.toDataURL("image/png") + ")"
          );
          $("body").removeClass("rendering");

          //updateHistory();
          test3D.updateCanvas(texture_canvas);
        });

        texture.getPhases(function (phases) {
          $(".phases").html("");

          params = texture.params();

          var img_outside = $("<img>");
          for (var key in phases) {
            var img = $("<img>");
            var container = $("<span>");
            img.attr("src", phases[key].toDataURL("image/png"));
            img.attr("params", JSON.stringify(params));
            img.appendTo(container);
            container.appendTo(".phases");
            var img_outside = img;
          }
          // Store the last image (combination of all images)
          img_outside.appendTo("#gallery .images");
          console.log("Stored image!");

          message("");
        });
      } catch (e) {
        clearTimeout(to);
        $("body").removeClass("rendering");
        message("Syntax error in params! " + e.message, 9000);
        console.error(e.stack);
      }
    }, 50);

    //var canvas = tgen(256).waves().waves({blend: 'difference'}).contrast({"adjust": 50}).toCanvas();
    //$('body').css('background-image', 'url(' + canvas.toDataURL("image/png") + ')');
  };

  test3D = {
    renderer: null,
    canvas: null,
    animid: null,
    starttime: null,
    time: null,
    sceneNumber: 2,

    texture1: null,
    texture2: null,
    texture3: null,
    texture_ref: null,

    start: function (canvas) {
      if (canvas !== undefined) {
        this.canvas = canvas;
      } else {
        this.canvas = texture.toCanvas();
      }

      this.starttime = new Date().getTime();
      this.init();
      this.animate();

      function onWindowResize() {
        test3D.part1.camera.aspect = window.innerWidth / window.innerHeight;
        test3D.part1.camera.updateProjectionMatrix();

        test3D.part2.camera.aspect = window.innerWidth / window.innerHeight;
        test3D.part2.camera.updateProjectionMatrix();

        test3D.renderer.setSize(window.innerWidth, window.innerHeight);
      }

      window.addEventListener("resize", onWindowResize, false);
    },

    stop: function () {
      //window.cancelAnimationFrame(test3D.animid);

      clearTimeout(test3D.animid);

      test3D.part1.reset();
      test3D.part2.reset();

      test3D.aframeid = null;
      test3D.renderer = null;
    },

    init: function () {
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMapEnabled = true;
      //this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

      var element = document.getElementById("three");
      element.appendChild(this.renderer.domElement);

      // global textures

      this.texture1 = new THREE.Texture(this.canvas);
      this.texture1.anisotropy = this.renderer.getMaxAnisotropy();
      this.texture1.wrapS = THREE.RepeatWrapping;
      this.texture1.wrapT = THREE.RepeatWrapping;
      this.texture1.repeat.set(4, 4);
      this.texture1.needsUpdate = true;

      this.texture2 = new THREE.Texture(this.canvas);
      this.texture2.anisotropy = this.renderer.getMaxAnisotropy();
      this.texture2.wrapS = THREE.RepeatWrapping;
      this.texture2.wrapT = THREE.RepeatWrapping;
      this.texture2.repeat.set(7, 7);
      this.texture2.needsUpdate = true;

      this.texture3 = new THREE.Texture(this.canvas);
      this.texture3.anisotropy = this.renderer.getMaxAnisotropy();
      this.texture3.wrapS = THREE.RepeatWrapping;
      this.texture3.wrapT = THREE.RepeatWrapping;
      this.texture3.repeat.set(1, 1);
      this.texture3.needsUpdate = true;

      this.texture_ref = new THREE.Texture(
        this.canvas,
        THREE.SphericalReflectionMapping
      );
      this.texture_ref.image = this.canvas;
      this.texture_ref.needsUpdate = true;

      this.part1.init();
      this.part2.init();
    },

    animate: function () {
      //test3D.animid = requestAnimationFrame(function () {
      //    test3D.animate();
      //});

      test3D.animid = setTimeout(function () {
        test3D.animate();
      }, 1000 / 30);

      var time = new Date().getTime() - this.starttime;

      if (test3D.sceneNumber == 1) {
        test3D.part1.animate(time);
        test3D.renderer.render(test3D.part1.scene, test3D.part1.camera);
      } else {
        test3D.part2.animate(time);
        test3D.renderer.render(test3D.part2.scene, test3D.part2.camera);
      }
    },

    updateCanvas: function (canvas) {
      if (this.canvas == null) {
        return;
      }

      if (
        test3D.canvas.width != canvas.width ||
        test3D.canvas.height != canvas.height
      ) {
        test3D.canvas.width = canvas.width;
        test3D.canvas.height = canvas.height;
      }

      var destCtx = this.canvas.getContext("2d");
      destCtx.drawImage(canvas, 0, 0);

      this.texture1.needsUpdate = true;
      this.texture2.needsUpdate = true;
      this.texture3.needsUpdate = true;
      this.texture_ref.needsUpdate = true;
    },

    part1: {
      scene: null,
      camera: null,
      mesh1: null,
      mesh2: null,
      mesh3: null,
      shadowLight: null,
      mirrorSphereCamera: null,

      animate: function (time) {
        // scene 1
        //test3D.mesh1.rotation.x += 0.005;
        //test3D.mesh1.rotation.y += 0.009;
        this.mesh2.rotation.x += 0.011;
        this.mesh2.rotation.y += 0.01;

        this.camera.position.x = 15 - Math.sin(time / 1500) * 30;
        this.camera.position.y = 15 - Math.cos(time / 1500) * 30;
        this.camera.position.z = 110 + Math.cos(time / 1500) * 15;
        this.camera.rotation.z = Math.sin(time / 5000) * 2;
        //this.camera1.rotation.x = Math.cos(time / 5000) * 5;

        this.mirrorSphereCamera.position = this.mesh2.position;
        this.mirrorSphereCamera.updateCubeMap(test3D.renderer, this.scene);
      },

      reset: function () {
        this.camera = null;
        this.scene = null;
        this.mesh1 = null;
        this.mesh2 = null;
        this.mesh3 = null;
        this.shadowLight = null;
        this.mirrorSphereCamera = null;
      },

      init: function () {
        this.scene = new THREE.Scene();

        // ------------------------- environment

        this.camera = new THREE.PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          1,
          1000
        );
        this.camera.position.z = 100;
        this.camera.lookAt(new THREE.Vector3(-30, 0, 0));

        this.scene.fog = new THREE.Fog(0x000000, 1, 300);

        var light_ambient = new THREE.AmbientLight(0x101010);
        this.scene.add(light_ambient);

        var light_point = new THREE.PointLight(0xffffff, 2.2, 1000);
        light_point.position.set(100, 100, 100);
        this.scene.add(light_point);

        this.mirrorSphereCamera = new THREE.CubeCamera(0.1, 200, 256);
        //mirrorSphereCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
        this.scene.add(this.mirrorSphereCamera);

        // ------------------------- objects

        var material1 = new THREE.MeshBasicMaterial({
          map: test3D.texture1,
          //side: THREE.DoubleSide,
          side: THREE.BackSide,
          depthWrite: false,
        });

        var geometry1 = new THREE.SphereGeometry(150, 150, 32);
        this.mesh1 = new THREE.Mesh(geometry1, material1);
        this.mesh1.castShadow = false;
        this.mesh1.receiveShadow = true;
        this.scene.add(this.mesh1);

        var material2 = new THREE.MeshPhongMaterial({
          map: test3D.texture2,
          //side: THREE.DoubleSide,
          ambient: 0x000000,
          color: 0xffffff,
          specular: 0xf1f1f1,
          shininess: 12,
          bumpMap: test3D.texture2,
          bumpScale: 0.41,
          metal: false,
          reflectivity: 0.7,
          envMap: this.mirrorSphereCamera.renderTarget,
        });

        var geometry2 = new THREE.SphereGeometry(40, 40, 32);
        this.mesh2 = new THREE.Mesh(geometry2, material2);
        this.mesh2.castShadow = true;
        this.mesh2.receiveShadow = false;
        this.scene.add(this.mesh2);
      },
    },

    part2: {
      scene: null,
      camera: null,
      mesh1: null,
      mesh2: null,
      mesh3: null,
      shadowLight: null,
      mirrorSphereCamera: null,

      animate: function (time) {
        // scene 2
        this.camera.position.x = Math.sin(time / 1500) * 25;
        this.camera.position.y = Math.cos(time / 1500) * 25;
        this.camera.position.z = Math.cos(time / 1500) * 125;
        this.camera.rotation.z = Math.sin(time / 5000) * 3;
        this.camera.rotation.x = 0.3 - Math.cos(time / 5000) * 0.3;

        this.mesh5.rotation.x += 0.027;
        this.mesh5.rotation.y += 0.023;
        this.mesh5.rotation.z += 0.02;
        this.mesh5.position.z = this.camera.position.z - 100;

        this.light1.position.x = 100 + Math.sin(time / 1500) * 25;
        this.light1.position.y = 100 + Math.cos(time / 1500) * 25;
        this.light1.position.z = -50 + Math.cos(time / 1500) * 125;

        this.mirrorSphereCamera.position = this.mesh5.position;
        this.mirrorSphereCamera.updateCubeMap(test3D.renderer, this.scene);
      },

      reset: function () {
        this.camera = null;
        this.scene = null;
        this.mesh1 = null;
        this.mesh2 = null;
        this.mesh3 = null;
        this.shadowLight = null;
        this.mirrorSphereCamera = null;
      },

      init: function () {
        this.scene = new THREE.Scene();

        // ------------------------- environment

        this.camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          1,
          1000
        );
        this.camera.position.x = -50;
        this.camera.position.z = 100;
        this.camera.lookAt(new THREE.Vector3(-50, 0, 0));

        this.scene.fog = new THREE.Fog(0x000000, 1, 340);

        var light_ambient = new THREE.AmbientLight(0x404040);
        this.scene.add(light_ambient);

        this.light1 = new THREE.PointLight(0xffffff, 1.2, 1000);
        this.light1.position.set(50, 50, -150);
        this.scene.add(this.light1);

        // ------------------------- objects

        var material1 = new THREE.MeshBasicMaterial({
          map: test3D.texture1,
        });

        var geometry1 = new THREE.PlaneGeometry(1000, 1000, 8);
        this.mesh3 = new THREE.Mesh(geometry1, material1);
        this.mesh3.position.y = 50;
        this.mesh3.rotation.x = Math.PI / 2;
        this.mesh3.castShadow = false;
        this.mesh3.receiveShadow = true;
        this.scene.add(this.mesh3);

        var material2 = new THREE.MeshPhongMaterial({
          map: test3D.texture2,
          //side: THREE.DoubleSide,
          ambient: 0x000000,
          color: 0xffffff,
          specular: 0xf1f1f1,
          shininess: 12,
          bumpMap: test3D.texture2,
          bumpScale: 0.41,
          metal: true,
        });

        var geometry2 = new THREE.PlaneGeometry(1000, 1000, 8);
        this.mesh4 = new THREE.Mesh(geometry2, material2);
        this.mesh4.position.y = -50;
        this.mesh4.rotation.x = -Math.PI / 2;
        this.mesh4.castShadow = false;
        this.mesh4.receiveShadow = true;
        this.scene.add(this.mesh4);

        this.mirrorSphereCamera = new THREE.CubeCamera(0.1, 200, 256);
        //mirrorSphereCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
        this.scene.add(this.mirrorSphereCamera);

        var material3 = new THREE.MeshPhongMaterial({
          map: test3D.texture3,
          //side: THREE.DoubleSide,
          ambient: 0x000000,
          color: 0xffffff,
          specular: 0xf1f1f1,
          shininess: 12,
          transparent: false,
          //opacity: 0.8,
          bumpMap: test3D.texture3,
          bumpScale: 0.5,
          metal: true,
          reflectivity: 0.7,
          //envMap: test3D.texture_ref
          envMap: this.mirrorSphereCamera.renderTarget,
        });

        var geometry3 = new THREE.BoxGeometry(50, 50, 50);
        this.mesh5 = new THREE.Mesh(geometry3, material3);
        this.mesh5.position.y = 0;
        //this.mesh5.rotation.z = Math.PI / 2;
        this.mesh5.castShadow = true;
        this.mesh5.receiveShadow = false;
        this.scene.add(this.mesh5);

        var light = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2, 1);
        light.position.set(100, -35, 100);
        light.target.position.set(-50, 0, -100);

        light.castShadow = true;
        light.shadowCameraNear = 1;
        light.shadowCameraFar = 1000;
        light.shadowCameraFov = 120;
        light.shadowCameraVisible = false;
        light.shadowBias = 0.0001;
        light.shadowDarkness = 0.7;
        light.shadowMapWidth = 1024;
        light.shadowMapHeight = 1024;
        this.scene.add(light);
      },
    },
  };

  var preset_id = "random";

  if (urlparams.preset) {
    if (presets.indexOf(urlparams.preset) >= 0) {
      preset_id = urlparams.preset;
    }
  }

  $("#presets").val(preset_id);
  paramsToEditor(preset_id);
  for (let i = 0; i < 10; i++) {
    console.log("Done with: ", i)
    generate();
  }

  if (urlparams["3d"]) {
    $(".3d").trigger("click");
  }
});
