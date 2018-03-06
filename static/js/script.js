{
	let allBuildingTypes = {}
	let buildingUriLink = {}
	const maxLimit = 1000
	const primaryMap = {
		map: L.map('mapid'),
		// Even though it's a singleton, knowing what the variables do lowers the reading diffuclty
		startingViewCoordinates: [52.3667, 4.9000],
		zoom: 13, 
		init: function () {
			this.map.setView(this.startingViewCoordinates, this.zoom)
			L.tileLayer.provider('Stamen.Watercolor').addTo(this.map)
			// let featuregroup = L.featureGroup()
			// featuregroup.addTo(mymap)
		}
	}
	primaryMap.init()
	const sparqlEndpoints = {
		adamEndpointPrefix: `https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=`,
		adamEndpointSuffix: `&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on`,
		gettyPrefix: `http://vocab.getty.edu/sparql.json?query=`,
		gettySuffix: `&implicit=false&implicit=true&equivalent=false&form=%2Fsparql`

	}

	const sparqlQueryHandler = {
		queryPrefixes: `
		PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		PREFIX hg: <http://rdf.histograph.io/>
		PREFIX dc: <http://purl.org/dc/elements/1.1/>
		PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
		PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
		prefix owl: <http://www.w3.org/2002/07/owl#>
		PREFIX geo: <http://www.opengis.net/ont/geosparql#>`,
		 
		sendQuery: function(query, urlPrefix = sparqlEndpoints.adamEndpointPrefix, urlSuffix = sparqlEndpoints.adamEndpointSuffix){
			return new Promise((resolve, reject) => {
				var self = this 
				completeQuery = this.constructQuery(query)
				completeUrl = this.prepareUrl(completeQuery, urlPrefix, urlSuffix)
				fetch(completeUrl)
				.then((resp) => {resolve(resp.json())})
				.catch((error) => reject(error))
			})	
		},
		constructQuery: function(query){
			console.log(this.queryPrefixes + query)
			return this.queryPrefixes + query
		},
		prepareUrl: function(query, prefix, suffix ) {
			console.log(suffix)
			encodedQuery = encodeURIComponent(query)
			console.log(prefix + encodedQuery + suffix)
			return prefix + encodedQuery + suffix
		}
	}
	const allBuildingTypesQuery = 
	`SELECT ?typelink (count(?typelink) as ?count) WHERE {
			?building rdf:type hg:Building .
			?building dc:type ?typelink .
		} group by ?typelink
		LIMIT ${maxLimit}`

	sparqlQueryHandler.sendQuery(allBuildingTypesQuery)
	.then((data) => {
		for(let bind of data.results.bindings){
			console.log(bind.count.value)
			sparqlQueryHandler.sendQuery(
			`
			select * where {
				<${bind.typelink.value}> skos:prefLabel ?buildingname 
					filter (lang(?buildingname) = 'nl')
			}`, sparqlEndpoints.gettyPrefix, sparqlEndpoints.gettySuffix)
			.then((data) => {
				if(data.results.bindings[0] !== undefined){
					buildingUriLink[bind.typelink.value] = data.results.bindings[0].buildingname.value
					allBuildingTypes[data.results.bindings[0].buildingname.value] = bind.count.value
				}else if(bind.count.value > 0){
					allBuildingTypes['overig'] += bind.count.value
				}
			})
		}
	})
	.catch((error)=>{
		console.log(error)
	})

	const objectsWithoutGettyType = `
	SELECT (count(?building) as ?buildings) WHERE {
		?building rdf:type hg:Building .
		FILTER NOT EXISTS {?building  dc:type ?typelink}
	}`
	sparqlQueryHandler.sendQuery(objectsWithoutGettyType)
	.then((data) => {
		allBuildingTypes['overig'] += data.results.bindings[0].buildings.value
	})
	.catch((error) => {
		console.log(error)
	})
	
	const churchQuery = `
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
	sparqlQueryHandler.sendQuery(churchQuery)
	.then((data) => {
		let churches = data.results.bindings.map((binding) => {
			console.log(binding)
			let datestring = binding.earliestBegin || 'test'
			let popupText = `${binding.label.value} ${datestring}`
			let newBinding = binding
			let wkt = newBinding.wkt.value
			if (!wkt.includes('Array')){
				console.log(this)
				var wicket = new Wkt.Wkt()
				wicket.read(wkt)
				wicket.write()
				newBinding.geoJson = wicket.toJson()
				console.log(primaryMap.map)
				
				L.geoJSON(newBinding.geoJson).bindPopup(popupText).addTo(primaryMap.map)	
			} return newBinding
		})
	})	
}