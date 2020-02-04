//Import the Shapefile
var desa = ee.FeatureCollection('users/alexroth/desa2010_indonesia')

//Select Province
/*var provinces = (desa.distinct('PROP').select('PROP').toList(33));
var allProvinces = provinces.map(function(feat) {
  return ee.String(ee.Feature(feat).get('KABDES'));
});
print("All Provinces: ", allProvinces)*/

//Pick district for calculations
var PROP = desa.filter(ee.Filter.eq('PROP', '35'))
var dists = PROP.distinct('KABDES').select('KABDES').toList(38)

var allDists = dists.map(function(feat) {
  return ee.String(ee.Feature(feat).get('KABDES'));
});

print(allDists)

//Function to map calculations over villages
var funct = function(DIST) {
//Load input imagery: Landsat 7 1-year 2010 composite.
var image = ee.Image('LANDSAT/LE7_TOA_1YEAR/2010')
Map.addLayer(image, {bands: ['B3', 'B2', 'B1']})

//print(image)

//Fixed Map settings 
var shown = true // true or false, 1 or 0 
var opacity = 0.5 // number [0-1]
var nameLayer = 'PROP'; // string
var visParams = {color: '808080'}; // dictionary:
Map.addLayer(PROP, visParams, '5317', shown, opacity); 
Map.centerObject(PROP, 13);

//CALCULATIONS ------------
//NDVI
var ndvi = image.normalizedDifference(['B4', 'B3']).rename('NDVI');

//NDWI
var ndwi = image.normalizedDifference(['B2', 'B4']).rename('NDWI');

//NDBI
var ndbi = image.normalizedDifference(['B5', 'B4']).rename('NDBI');

//Enhanced Vegetation Index
var nir = image.select('B4');
var red = image.select('B3');
var blue = image.select('B1');
var evi = ((nir.subtract(red)).divide(nir.add((red).multiply(6)).subtract((blue).multiply(7.5)).add(1))).multiply(2.5).rename('EVI');
// -------------------------

//Print village name
//var village_name = village.first().getString('KODE2010');
//print(village_name)

//Add calculations bands to village image 
var addNDBands = function(image) {
  image = image.addBands(ndvi);
  image = image.addBands(ndwi);
  image = image.addBands(ndbi);
  image = image.addBands(evi);
  return image;
};
print(addNDBands(image))
var allBand_image = addNDBands(image);

//Mean reducer over province or district
var districtValues = allBand_image.reduceRegions({
  collection: PROP,
  reducer: ee.Reducer.mean(),
  scale: 30
});

print(districtValues);

//Export the calculations
Export.table.toDrive({
  collection: districtValues,
  description: 'means',
  folder: 'Jan31_means',
  fileNamePrefix: '3529000000_means',
  selectors: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6_VCID_2', 'B7', 'KODE2010', 'NDBI', 'NDVI', 'NDWI']
});
}
var DIST = desa.filter(ee.Filter.eq('KABDES', '3513000000'))
funct(DIST)
