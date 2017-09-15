const THREE = require("../../node_modules/three/build/three.js");
const ThreeboxConstants = require("../constants.js");
const utils = require("../Utils/Utils.js");
const ValueGenerator = require("../Utils/ValueGenerator.js");

console.log(THREE);

function SpriteLayer(parent, options) {
    console.log("Entered SpriteLayer() with parent = " + parent + ", and options = " + options);
    if(options === undefined) return console.error("Invalid options provided to SpriteLayer");
    // TODO: Better error handling here

    if(options.spriteName === undefined) return console.error("spriteName must be provided to SpriteLayer");
    if(options.spritesheetPath === undefined) return console.error("spritesheetPath must be provided to SpriteLayer");
    if(options.offsetX === undefined) return console.error("offsetX must be provided to SpriteLayer");
    if(options.offsetY === undefined) return console.error("offsetY must be provided to SpriteLayer");
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

    this.spritesheetPathGen = ValueGenerator(options.spritesheetPath);
    this.spriteNameGen = ValueGenerator(options.spriteName);
    this.spriteNameGen = ValueGenerator(options.offsetX);
    this.spriteNameGen = ValueGenerator(options.offsetY);
    this.scaleGen = ValueGenerator(options.scale);
    this.features = Object.create(null);
    this.scaleWithMapProjection = options.scaleWithMapProjection;

 //   this.loaded = false;
    this._initialize();
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
                    geojson: feature
                };
                this.features[key].properties = {
                    spritesheetPath: spritesheetPath,
                    spriteName: spriteName
                };
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
 //       var spriteNames = [];
        
                // Determine how to load the models
                if(!this.spriteNameGen)
                    return console.error("Invalid img name definition provided to SpriteLayer");
                if(!this.spritesheetPathGen)
                    return console.error("Invalid model directory definition provided to SpriteLayer");
        
                // Add features to a map
                this.source.features.forEach((f,i) => {
                    const key = this.keyGen(f,i); // TODO: error handling
                    if(this.features[key] !== undefined) console.warn("Features with duplicate key: " + key);
        
                    const spritesheetPath = this.spritesheetPathGen(f,i);
                    const spriteName = this.spriteNameGen(f,i);
                    this.features[key] = {
                        geojson: f,
                        spritesheetPath: spritesheetPath,
                        spriteName: spriteName                      
                    }
        
 //                  spriteNames.push({directory: spritesheetPath, name: spriteName});
                });
                this._addOrUpdateFeatures(this.features);
 
    },
    _addOrUpdateFeatures: function(features) {
        console.log("Entered spriteLayer._addOrUpdateFeatures with features = " + JSON.stringify(features) );
        for (key in features) {
            const f = features[key];
            const position = f.geojson.geometry.coordinates;
            const scale = this.scaleGen(f.geojson);
            const spritesheetPath = f.spritesheetPath;
 //           const rotation = this.rotationGen(f.geojson);

            var spriteMap = new THREE.TextureLoader().load( spritesheetPath );
            spriteMap.offset.x = f.offsetX;
            spriteMap.offset.y = f.offsetY;
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