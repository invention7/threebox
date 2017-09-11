const THREE = require("../../node_modules/three/build/three.js");
const ThreeboxConstants = require("../constants.js");
const utils = require("../Utils/Utils.js");
const ValueGenerator = require("../Utils/ValueGenerator.js");

console.log(THREE);

function SpriteLayer(parent, options) {
    if(options === undefined) return console.error("Invalid options provided to SpriteLayer");
    // TODO: Better error handling here

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

    this.scaleGen = ValueGenerator(options.scale);
    this.features = Object.create(null);
    this.scaleWithMapProjection = options.scaleWithMapProjection;

    this.loaded = false;
}

SpriteLayer.prototype = {
    updateSourceData: function(source, absolute) {
        var oldFeatures = {}

        if (!source.features) return console.error("updateSourceData expects a GeoJSON FeatureCollection with a 'features' property");
        source.features.forEach((feature, i) => {
            const key = this.keyGen(feature,i); // TODO: error handling
            if (key in this.features) {
                // Update
                this.features[key].geojson = feature;
                oldFeatures[key] = feature;
            }
            else {
                // Create
                this.features[key] = {
                    geojson: feature,
                    spriteimg: imgDirectory + imgName
                }
            }
        });

        this._addOrUpdateFeatures(this.features)

        if(absolute) {
            // Check for any features that are not have not been updated and remove them from the scene
            for(key in this.features) {
                if(!key in oldFeatures) {
                    this.removeFeature(key);
                }
            }
        }

        this.source = source;

    },
    removeFeature: function(key) {
        this.parent.remove(this.features[key].rawObject);
        delete this.features[key];
    },
    _initialize: function() {

        // Add features to a map
        this.source.features.forEach((f,i) => {
            const key = this.keyGen(f,i); // TODO: error handling
            if(this.features[key] !== undefined) console.warn("Features with duplicate key: " + key);
        });
    },
    _addOrUpdateFeatures: function(features) {
        for (key in features) {
            const f = features[key];
            const position = f.geojson.geometry.coordinates;
            const scale = this.scaleGen(f.geojson);
            const _img = f.spriteimg;
            const rotation = this.rotationGen(f.geojson);

            var spriteMap = new THREE.TextureLoader().load( _img );
            var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
            var sprite = new THREE.Sprite( spriteMaterial );

            if (!f.rawObject) {
                // Need to create a scene graph object and add it to the scene
                this.parent.addAtCoordinate(sprite, position, {scaleToLatitude: this.scaleWithMapProjection, preScale: scale});
                //this.features[key] = f;
            }
            else {
                this.parent.moveToCoordinate(sprite, position, {scaleToLatitude: this.scaleWithMapProjection, preScale: scale});
            }
        }
    }
}

module.exports = exports = SpriteLayer;