{
	let allBuildingTypes = {}
	let buildingUriLink = {}
    let limit = 10
	var sparqlquery = `
	PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
	PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
	PREFIX hg: <http://rdf.histograph.io/>
	PREFIX dc: <http://purl.org/dc/elements/1.1/>

	SELECT ?typelink (count(?typelink) as ?count) WHERE {
		?building rdf:type hg:Building .
		?building dc:type ?typelink .
	} group by ?typelink
	LIMIT ${limit}`
	var mymap = L.map('mapid').setView([52.3667, 4.9000], 13);
	var Stamen_TerrainBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
	}).addTo(mymap)

	var polygon = L.polygon([
		[51.509, -0.08],
		[51.503, -0.06],
		[51.51, -0.047]
	]).addTo(mymap);

	console.log('my map',mymap) 
	let featuregroup = L.featureGroup()
	featuregroup.addTo(mymap)
	var encodedquery = encodeURIComponent(sparqlquery);

	var queryurl = 'https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedquery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
	fetch(queryurl)
	.then((resp) => resp.json()) // transform the data into json
  	.then(function(data) {
		console.log(data)
		for(let bind of data.results.bindings){
			console.log(bind.count.value)
			let gettyQuery = `
			prefix skos: <http://www.w3.org/2004/02/skos/core#>
			select * where {
				<${bind.typelink.value}> skos:prefLabel ?buildingname 
				 filter (lang(?buildingname) = 'nl')
			}`
			const encodedGettyQuery = encodeURIComponent(gettyQuery)
			fetch(`http://vocab.getty.edu/sparql.json?query=${encodedGettyQuery}&_implicit=false&implicit=true&_equivalent=false&_form=%2Fsparql`)
			.then((resp) => resp.json())
			.then(function(data) {
                console.log(bind.count.value)
                if(data.results.bindings[0] !== undefined){
					buildingUriLink[bind.typelink.value] = data.results.bindings[0].buildingname.value
                    allBuildingTypes[data.results.bindings[0].buildingname.value] = bind.count.value
                }
                else if(bind.count.value > 0){
                    allBuildingTypes['overig'] += bind.count.value
                }
            
			})
			console.log(allBuildingTypes)
		}
	
        let objectsWithoutGettyType = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX hg: <http://rdf.histograph.io/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        SELECT (count(?building) as ?buildings) WHERE {
            ?building rdf:type hg:Building .
            FILTER NOT EXISTS {?building  dc:type ?typelink}
          } `
        const encodedObjectsWithoutGettyType = encodeURIComponent(objectsWithoutGettyType)
        fetch('https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedObjectsWithoutGettyType + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on')
        .then((response) => response.json())
        .then(function(data) {
            console.log(data)
            allBuildingTypes['overig'] += data.results.bindings[0].buildings.value
        })
	})
	.catch(function(error) {
		console.log(error);
	});

	let churchQuery = `
	PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
	PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
	PREFIX hg: <http://rdf.histograph.io/>
	PREFIX dc: <http://purl.org/dc/elements/1.1/>
	PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
	PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
	prefix owl: <http://www.w3.org/2002/07/owl#>
	PREFIX geo: <http://www.opengis.net/ont/geosparql#>
	SELECT * WHERE {
	  ?building rdf:type hg:Building .
	  ?building rdf:type hg:Building .
	  ?building skos:prefLabel ?label .
	  ?building geo:hasGeometry/geo:asWKT ?wkt .
	  optional{?building owl:sameAs ?sameas }.
	  optional{?building sem:hasEarliestBeginTimeStamp ?earliestBegin } .
	  optional{?building sem:hasLatestBeginTimeStamp ?latestBegin } .
	  optional{?building sem:hasEarliestEndTimeStamp ?earliestEnd } .
	} `
	const encodedChurchQuery = encodeURIComponent(churchQuery)
	fetch('https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedChurchQuery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on')
        .then((response) => response.json())
        .then(function(data) {
			let churches = data.results.bindings.map((binding) => {
				let newBinding = binding
				let wkt = newBinding.wkt.value
				if (!wkt.includes('Array')){
					var wkt_geom = wkt;
					var wicket = new Wkt.Wkt();
					wicket.read(wkt_geom);

					// "greenIcon from official documentation noted above.
					var feature = wicket.toObject();

					// Presumably featureGroup is already instantiated and added to your map.
					featuregroup.addLayer(feature);
					// newBinding.geojson = Terraformer.WKT.parse(wkt)
					console.log(featuregroup)

					// console.log(L.GeoJSON.coordsToLatLng(newBinding.geojson.coordinates))
					// reduceAndFlipArray(newBinding.geojson.coordinates)
					// function reduceAndFlipArray(array){
					// 	for(let inlinearr of array){
					// 		console.log(inlinearr)
					// 		if(checkIfArray(inlinearr)){
					// 			inlinearr.reverse()
					// 		}
					// 		else {
					// 			array.coordinates.reverse()
					// 		}
					// 	}
						
					// 	console.log(array)
						
					// 	function checkIfArray(array){
					// 		array.constructor === Array
					// 	}
					// }
					
					// if(newBinding.geojson.type === 'Polygon'){ 
					// 	// console.log('adding polygon')
					// 	let polygon = L.polygon(newBinding.geojson.coordinates)
					// 	.addTo(mymap)

					// 	// console.log(mymap)
					// }
					
					
				}
				return newBinding})
		
            console.log('churchdata', churches)
		})
}