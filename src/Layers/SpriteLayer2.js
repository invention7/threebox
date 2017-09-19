const THREE = require("three/build/three.js");
const ThreeboxConstants = require("../constants.js");
const utils = require("../Utils/Utils.js");
const ValueGenerator = require("../Utils/ValueGenerator.js");

console.log(THREE);

function SpriteLayer(parent, options) {
//    console.log("Entered SpriteLayer() with parent = " + parent + ", and options = " + options);
    if(options === undefined) return console.error("Invalid options provided to SpriteLayer");
    // TODO: Better error handling here

    if(options.texture === undefined) return console.error("texture must be provided to SpriteLayer");
    if(options.scale === undefined) options.scale = 1.0;
    if(options.scaleWithMapProjection === undefined) options.scaleWithMapProjection = true;
    if(options.key === undefined || options.key === '' || (typeof options.key === 'object' && options.key.property === undefined && options.key.generator === undefined)) {
        options.key = { generator: (v,i) => i };
        console.warn("Using array index for SpriteLayer key property.");
    }

    this.parent = parent;

    this.id = options.id;
    this.keyGen = ValueGenerator(options.key);
    if (typeof options.source === "string")
        this.sourcePath = options.source;
    else
        this.source = options.source;

    this.texture = options.texture;
    this.scaleGen = ValueGenerator(options.scale);
    this.features = Object.create(null);
    this.scaleWithMapProjection = options.scaleWithMapProjection;

 //   this.loaded = false;
    this._initialize();
}

SpriteLayer.prototype = {
    updateSourceData: function(source, absolute) {
//        var oldFeatures = {}

        if (!source) return console.error("updateSourceData expects a GeoJSON FeatureCollection with a 'feature' property");
/*       source.features.forEach((feature, i) => {
            const key = this.keyGen(feature,i); // TODO: error handling
            if (key in this.features) {
                // Update
                this.features[key].geojson = feature;
                oldFeatures[key] = feature;
            }
            else {
                // Create
                this.features[key] = {
                    geojson: feature
                };
                this.features[key].properties = {
                };
            }
        });
*/
        this.source = source;
        this._addOrUpdateFeatures(this.source, this.texture);
/*
        if(absolute) {
            // Check for any features that are not have not been updated and remove them from the scene
            for(key in this.features) {
                if(!key in oldFeatures) {
                    this.removeFeature(key);
                }
            }
        }
*/
 //       this.source = source;

    },
    removeFeature: function(key) {
        this.parent.remove(this.features[key].rawObject);
        delete this.features[key];
    },
    _initialize: function() {
 //       var spriteNames = [];
        
                // Add features to a map
                this._addOrUpdateFeatures(this.source, this.texture);
 
    },
    _addOrUpdateFeatures: function(feature, _texture) {
     //   console.log("Entered spriteLayer._addOrUpdateFeatures with _texture = " + _texture + " and features = " + JSON.stringify(feature) );
       
            const f = feature;
      //      console.log("f = " + JSON.stringify(f));
            const position = f.geometry.coordinates;
            const scale = 100;

            var spriteMaterial = new THREE.SpriteMaterial( { map: _texture, color: 0xffffff } );
            var sprite = new THREE.Sprite( spriteMaterial );

            if (!f.rawObject) {
                // Need to create a scene graph object and add it to the scene
     //           console.log("adding Sprite, sprite = " + sprite + ", position = " + position + ", scale = " + scale );
                this.parent.addAtCoordinate(sprite, position, {scaleToLatitude: this.scaleWithMapProjection, preScale: scale});
                //this.features[key] = f;
            }
            else {
                this.parent.moveToCoordinate(sprite, position, {scaleToLatitude: this.scaleWithMapProjection, preScale: scale});
            }
        
    }
}

module.exports = exports = SpriteLayer;