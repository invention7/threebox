const THREE = require("../../node_modules/three/build/three.js");
const ThreeboxConstants = require("../constants.js");
const utils = require("../Utils/Utils.js");
const ValueGenerator = require("../Utils/ValueGenerator.js");

console.log(THREE);

function SpriteLayer(parent, options) {
    console.log("Entered SpriteLayer() with parent = " + parent + ", and options = " + options);
    if(options === undefined) return console.error("Invalid options provided to SpriteLayer");
    // TODO: Better error handling here

    if(options.imgName === undefined) options.imgName = 'sprite2.png';
    if(options.imgDirectory === undefined) options.imgDirectory = '../assets/img/';
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

    this.imgDirectoryGen = ValueGenerator(options.imgDirectory);
    this.imgNameGen = ValueGenerator(options.imgName);
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
                    spriteimg: imgDirectory + imgName
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
 //       var imgNames = [];
        
                // Determine how to load the models
                if(!this.imgNameGen)
                    return console.error("Invalid img name definition provided to SpriteLayer");
                if(!this.imgDirectoryGen)
                    return console.error("Invalid model directory definition provided to SpriteLayer");
        
                // Add features to a map
                this.source.features.forEach((f,i) => {
                    const key = this.keyGen(f,i); // TODO: error handling
                    if(this.features[key] !== undefined) console.warn("Features with duplicate key: " + key);
        
                    const imgDirectory = this.imgDirectoryGen(f,i);
                    const imgName = this.imgNameGen(f,i);
                    this.features[key] = {
                        geojson: f,
                        properties:{
                            spriteimg: imgDirectory + imgName
                        }
                    }
        
 //                  imgNames.push({directory: imgDirectory, name: imgName});
                });
                this._addOrUpdateFeatures(this.features);
 /*       
                // Filter out only unique imgs
                imgNames.forEach(m => this.images[(m.directory + m.name)] = { directory: m.directory, name: m.name, loaded: false });
        
                // And load models asynchronously
                var remaining = Object.keys(this.images).length;
                console.log("Loading " + remaining + " images", this.images);
                const imgComplete = (m) => {
                    console.log("Image complete!", m);
                    //if(this.images[m].loaded) 
                    if(--remaining === 0) {
                        this.loaded = true;
                        this._addOrUpdateFeatures(this.features);
                    }
                }
 */       
 /*               for (m in this.images) {
                    // TODO: Support formats other than OBJ/MTL
                    const objLoader = new OBJLoader();
                    const materialLoader = new MTLLoader();
        
                    var loadObject = ((modelName) => { return (materials) => {
                        // Closure madness!
                        if(materials) {
                            materials.preload();
        
                            for(material in (materials.materials)) {
                                materials.materials[material].shininess /= 50;  // Shininess exported by Blender is way too high
                            }
                            
                            objLoader.setMaterials( materials );
                        }
                        objLoader.setPath(this.images[modelName].directory);
                        
                        console.log("Loading model ", modelName);
        
                        objLoader.load(this.images[modelName].name + ".obj", obj => {
                            this.images[modelName].obj = obj;
                            this.images[modelName].isMesh = obj.isMesh;
                            this.images[modelName].loaded = true;
        
                            modelComplete(modelName);
                        }, () => (null), error => {
                            console.error("Could not load SymbolLayer3D model file.");    
                        } );
        
                    }})(m);
        
                    materialLoader.setPath(this.images[m].directory);
                    materialLoader.load(this.images[m].name + ".mtl", loadObject, () => (null), error => {
                        console.warn("No material file found for SymbolLayer3D model " + m);
                        loadObject();
                    });
                }
*/
  //          },
    },
    _addOrUpdateFeatures: function(features) {
        console.log("Entered spriteLayer._addOrUpdateFeatures with features = " + JSON.stringify(features) );
        for (key in features) {
            const f = features[key];
            const position = f.geojson.geometry.coordinates;
            const scale = this.scaleGen(f.geojson);
            const spriteimg = f.properties.spriteimg;
 //           const rotation = this.rotationGen(f.geojson);

            var spriteMap = new THREE.TextureLoader().load( spriteimg );
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