// This is a JavaScript file

var application_key = "119223fe547d979bc2dc22ecc7f09daabf7211cc08b58379a2b7d2c9428f2872";
var client_key = "c3d36f8a72521df094762c70522e7f916c44557b558ba92d55ea316e9c4bc6c7";

var ncmb = new NCMB(application_key, client_key);
var Places = ncmb.DataStore("Places");
var map = new OpenLayers.Map("map");
var mapnik = new OpenLayers.Layer.OSM();
map.addLayer(mapnik);

// マーカーを表示するためのレイヤーを準備
var markers = new OpenLayers.Layer.Markers("Markers");
map.addLayer(markers);


var projection3857 = new OpenLayers.Projection("EPSG:3857");
var projection4326 = new OpenLayers.Projection("EPSG:4326");
var popup = null;

var ncmbController = {
  run: function() {
    var self = this;
    // 現在位置を取得します
    navigator.geolocation.getCurrentPosition(function(location) {
      // 現在位置を取得すると、locationという変数の位置情報オブジェクトが入ります
      // 位置情報を使って、OpenLayersの位置情報オブジェクトに変換します
      // その際、EPSG:4326からEPSG:3857に変換する指定を行います
      var lonLat = new OpenLayers.LonLat(location.coords.longitude, location.coords.latitude)
       .transform(
         projection4326,
         projection3857
      );
      // 作成した位置情報を地図の中央に設定します
      map.setCenter(lonLat, 15);
      
      // マーカーを検索する処理です
      ncmbController.findMarkers(location.coords.latitude, location.coords.longitude);
      
      // ボタンを追加する処理です
      ncmbController.addButton();
    });
  },

  findMarkers: function(latitude, longitude) {
    // mBaaSの位置情報オブジェクトを作成
    var current_position = new ncmb.GeoPoint(latitude, longitude);
    Places
      .withinKilometers("point", current_position, 100)
      .limit(20)
      .fetchAll()
      .then(function(places) {
        markers.clearMarkers();
        for (var i = 0; i < places.length; i++) {
          var place = places[i];
          ncmbController.addMarker(place.areaName, place.point.latitude, place.point.longitude);
        }
      })
      .catch(function(err) {
        alert("エラーが発生しました");
      });
    
  },

  addMarker: function(areaName, latitude, longitude) {
    // マーカーを表示するためのレイヤーを準備
    // var markers = new OpenLayers.Layer.Markers("Markers");
    console.log(latitude, longitude);
    // if(map.hasLayer(markers)) {
    //   map.removeLayer(markers);
    // }
    // map.addLayer(markers);

    
    // マーカーを作成
    var marker = new OpenLayers.Marker(
      new OpenLayers.LonLat(longitude, latitude)
      .transform(
        projection4326,
        projection3857
      )
    );
    // マーカーのタグとしてエリア名を指定
    marker.tag = areaName;
    
    // マーカーをタップした際にポップアップを表示します
    marker.events.register("touchstart", marker, function(event) {
      // すでに別なポップアップが開いていたら消します
      if (popup) map.removePopup(popup);
      // ポップアップを作成
      popup = new OpenLayers.Popup("chicken",
           event.object.lonlat,
           new OpenLayers.Size(100,50),
           event.object.tag,
           true);
      // 作成したポップアップを地図に追加します
      map.addPopup(popup);
    });
    
    // 作成したマーカーを地図（マーカーレイヤー）に追加します
    markers.addMarker(marker);
  },

  addButton: function() {
    var custom_button = new OpenLayers.Control.Button({
      displayClass : 'olControlCustomButton',
      trigger : ncmbController.createPlace
    })
    var custom_button2 = new OpenLayers.Control.Button({
      displayClass : 'olControlCustomButton2',
      trigger : ncmbController.reload
    })
    var custom_button3 = new OpenLayers.Control.Button({
      displayClass : 'olControlCustomButton3',
      trigger : ncmbController.goBack2CurrentPos
    })
    var control_panel = new OpenLayers.Control.Panel({});
    control_panel.addControls([custom_button])
    control_panel.addControls([custom_button2])
    control_panel.addControls([custom_button3])
    map.addControl(control_panel);
  },

  createPlace: function() {
    // エリア名の入力を促す
    var areaName = prompt("場所の名前を入力してください");
    // navigator.geolocation.getCurrentPosition(function(location) {
      // var geoPoint = new ncmb.GeoPoint(location.coords.latitude, location.coords.longitude);
      var lonLatNow = new OpenLayers.LonLat(map.getCenter().lon, map.getCenter().lat)
      // OpenLayersの位置情報を使って、ncmbGeoPoint位置情報に変換します
      // その際、EPSG:3857からEPSG:4326に変換する指定を行います
      .transform(
        projection3857,
        projection4326
      );
      var geoPoint = new ncmb.GeoPoint(lonLatNow.lat, lonLatNow.lon);
      var place = new Places();
      place.set("areaName", areaName);
      place.set("point", geoPoint);
      place.save()
      .then(function(point) {
        ncmbController.addMarker(point);
      })
      .catch(function(err) {
        alert("エラーが発生しました。再度行ってください")
      });
    // });
  },

  reload: function() {
    // // 表示位置を取得します
    var lonLat = new OpenLayers.LonLat(map.getCenter().lon, map.getCenter().lat);
    // // 作成した位置情報を地図の中央に設定します
    // map.setCenter(lonLat, 15);
    map.setCenter(lonLat);
    
    // マーカーを検索する処理です
    // ncmbController.findMarkers(lonLat.latitude, lonLat.longitude);
    lonLat.transform(projection3857,projection4326);
    // console.log(lonLat.lat, lonLat.lon);
    ncmbController.findMarkers(lonLat.lat, lonLat.lon);
    
    // ボタンを追加する処理です
    // ncmbController.addButton();
    

  },
  
  goBack2CurrentPos: function() {
    // 現在位置を取得します
    navigator.geolocation.getCurrentPosition(function(location) {
      // 現在位置を取得すると、locationという変数の位置情報オブジェクトが入ります
      // 位置情報を使って、OpenLayersの位置情報オブジェクトに変換します
      // その際、EPSG:4326からEPSG:3857に変換する指定を行います
      var lonLat = new OpenLayers.LonLat(location.coords.longitude, location.coords.latitude)
       .transform(
         projection4326,
         projection3857
      );
      // 作成した位置情報を地図の中央に設定します
      map.setCenter(lonLat, 15);
      
      // マーカーを検索する処理です
      ncmbController.findMarkers(location.coords.latitude, location.coords.longitude);
      
      // ボタンを追加する処理です
      // ncmbController.addButton();
    });

  }
};

var event = typeof cordova === 'undefined' ? 'DOMContentLoaded' : 'deviceready';

document.addEventListener(event, ncmbController.run, false);