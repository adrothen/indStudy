//Import the Shapefile
var desa = ee.FeatureCollection('users/alexroth/desa2010_indonesia')
print(desa.first());

//Select province
var provinces = (desa.distinct('PROP').select('PROP').toList(33));
var allProvinces = provinces.map(function(feat) {
  return ee.String(ee.Feature(feat).get('PROP'));
});
print("All Provinces: ", allProvinces)

//Begin Function over villages in province
var funct = function(PROV) {

//Load input imagery: Landsat 7 1-year 2010 composite.
var image = ee.Image('LANDSAT/LE7_TOA_1YEAR/2010')
Map.addLayer(image, {bands: ['B3', 'B2', 'B1']});

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

//Calculate Band Percentiles  
var percentileDictionary = allBand_image.reduceRegions({
  collection: PROV,
  reducer: ee.Reducer.percentile([0,10,20,30,40,50,60,70,80,90,100]),
  scale: 30
});
print(percentileDictionary);

//Export village percentiles 
Export.table.toDrive({
  collection: percentileDictionary,
  description: 'prov71_TOA2010_percentile',
  folder: 'TOA2010Composite_percentiles'
});
}
//Enter province data
var PROV = desa.filter(ee.Filter.eq('PROP', '71'));
funct(PROV);
