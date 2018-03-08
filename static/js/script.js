{
	let allBuildingTypes = {}
	let buildingUriLink = {}
	let clickedChurch = {}
	let intr = false
	let churches = []
	var slider =  document.getElementById("range-slider")
	// var output = document.getElementById("currentYear")
	var button = document.getElementById("timeTravelButton")
	var rangeSlider = document.getElementById("range-slider");
	var rangeLabel = document.getElementById("range-label");
	

	let intialSlider = slider.value
	showSliderValue()


		
	const maxLimit = 1000
	const primaryMap = {
		map: L.map('mapid'),
		// Even though it's a singleton, knowing what the variables do lowers the reading diffuclty
		startingViewCoordinates: [52.3667, 4.9000],
		zoom: 13, 
		init: function () {
			this.map.setView(this.startingViewCoordinates, this.zoom)
			L.tileLayer.provider('Stamen.Watercolor').addTo(this.map)
			L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
			
			// featuregroup.addTo(mymap)
		}
	}
	primaryMap.init()
	let featuregroup = L.geoJSON()
	featuregroup.addTo(primaryMap.map)


	const sparqlEndpoints = {
		adamEndpointPrefix: `https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=`,
		adamEndpointSuffix: `&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on`,
		gettyPrefix: `http://vocab.getty.edu/sparql.json?query=`,
		gettySuffix: `&implicit=false&implicit=true&equivalent=false&form=%2Fsparql`

	}

	function onClick(eventObj) {

		clickedChurch = churches.find(church => church.geoJson._leaflet_id === eventObj.target._leaflet_id)
		// console.log(churches.find(church => church.geoJson._leaflet_id === eventObj.target._leaflet_id))
		container = document.getElementById("imgcontainer")
		container.innerHTML = ""
		try {
			for(let img of clickedChurch.images){	
				let newImg = document.createElement('img')
				newImg.src = img.depiction.value
				container.appendChild(newImg)
			}
		}catch(e) {
			container.innerHTML = "Dit gebouw heeft geen beeldmateriaal beschikbaar!"
		}
	}

	const sparqlQueryHandler = {
		queryPrefixes: `
		PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		PREFIX hg: <http://rdf.histograph.io/>
		PREFIX dc: <http://purl.org/dc/elements/1.1/>
		PREFIX dct: <http://purl.org/dc/terms/>
		PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
		PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
		PREFIX owl: <http://www.w3.org/2002/07/owl#>
		PREFIX geo: <http://www.opengis.net/ont/geosparql#>
		PREFIX foaf: <http://xmlns.com/foaf/0.1/>`,
		 
		sendQuery: function(query, urlPrefix = sparqlEndpoints.adamEndpointPrefix, urlSuffix = sparqlEndpoints.adamEndpointSuffix){
			return new Promise((resolve, reject) => {
				var self = this 
				completeQuery = this.constructQuery(query)
				completeUrl = this.prepareUrl(completeQuery, urlPrefix, urlSuffix)
				fetch(completeUrl)
				.then((resp) => {
					resolve(resp.json())})
				.catch((error) => reject(error))
			})	
		},
		constructQuery: function(query){
			return this.queryPrefixes + query
		},
		prepareUrl: function(query, prefix, suffix ) {
			encodedQuery = encodeURIComponent(query)
			return prefix + encodedQuery + suffix
		}
	}
	// const allBuildingTypesQuery = 
	// `SELECT ?typelink (count(?typelink) as ?count) WHERE {
	// 		?building rdf:type hg:Building .
	// 		?building dc:type ?typelink .
	// 	} group by ?typelink
	// 	LIMIT ${maxLimit}`

	// sparqlQueryHandler.sendQuery(allBuildingTypesQuery)
	// .then((data) => {
	// 	for(let bind of data.results.bindings){
	// 		sparqlQueryHandler.sendQuery(
	// 		`
	// 		select * where {
	// 			<${bind.typelink.value}> skos:prefLabel ?buildingname 
	// 				filter (lang(?buildingname) = 'nl')
	// 		}`, sparqlEndpoints.gettyPrefix, sparqlEndpoints.gettySuffix)
	// 		.then((data) => {
	// 			if(data.results.bindings[0] !== undefined){
	// 				buildingUriLink[bind.typelink.value] = data.results.bindings[0].buildingname.value
	// 				allBuildingTypes[data.results.bindings[0].buildingname.value] = bind.count.value
	// 			}else if(bind.count.value > 0){
	// 				allBuildingTypes['overig'] += bind.count.value
	// 			}
	// 		})
	// 	}
	// })
	// .catch((error)=>{
	// 	console.log(error)
	// })

	// const objectsWithoutGettyType = `
	// SELECT (count(?building) as ?buildings) WHERE {
	// 	?building rdf:type hg:Building .
	// 	FILTER NOT EXISTS {?building  dc:type ?typelink}
	// }`
	// sparqlQueryHandler.sendQuery(objectsWithoutGettyType)
	// .then((data) => {
	// 	allBuildingTypes['overig'] += data.results.bindings[0].buildings.value
	// })
	// .catch((error) => {
	// 	console.log(error)
	// })

	// Testing with groups to delete it later >:)	
	

	

	console.log(L.AwesomeMarkers.icon({
		icon: 'help-buoy',
		markerColor: 'green'
	}))
	var tooltipLegend = L.control({position: 'bottomright'})
	tooltipLegend.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info tooltips')
		div.innerHTML = 
		`<div class="legenditem"> <div class="awesome-marker-icon-green awesome-marker tooltip"></div><div> Dit gebouw heeft beeldmateriaal</div></div> <br/>
		<div class="legenditem"> <div class="awesome-marker-icon-red awesome-marker tooltip"></div><div> Dit gebouw heeft geen beeldmateriaal</div> </div>`
		return div;	
	}
	tooltipLegend.addTo(primaryMap.map)

	var tooltipYear = L.control({position:'topright'})
	tooltipYear.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info yearindex')
		div.innerHTML = 
		`<div> U bevindt zich in het jaar </div> <div id="year"> ${slider.value} </div>`
		return div
	}
	tooltipYear.updateYear = function(props) {
		document.getElementById('year').innerHTML = slider.value
	}

	tooltipYear.addTo(primaryMap.map)
	


	function generatePopup(object){
		let datestring = ''
			try {
				datestring = object.earliestBegin.value
			}
			catch(e) {
				datestring = 'geen begin datum'
			}
		return popupText = `${object.label.value} ${datestring}`
	}


	const churchQuery = `
	SELECT * WHERE {
	  ?building rdf:type hg:Building .
	  ?building rdf:type hg:Building .
	  ?building skos:prefLabel ?label .
	  ?building geo:hasGeometry/geo:asWKT ?wkt .
	  optional{?building owl:sameAs ?sameas } .
	  optional{?building sem:hasEarliestBeginTimeStamp ?earliestBegin } .
	  optional{?building sem:hasLatestBeginTimeStamp ?latestBegin } .
	  optional{?building sem:hasEarliestEndTimeStamp ?earliestEnd } .
	} `
	sparqlQueryHandler.sendQuery(churchQuery)
	.then((data) => {
		churches = data.results.bindings.map((binding) => {
			let newBinding = binding
			let wkt = newBinding.wkt.value
			if (!wkt.includes('Array')){
				var wicket = new Wkt.Wkt()
				wicket.read(wkt)
				wicket.write()
				newBinding.GeoJsonData = wicket.toJson()
				newBinding.geoJson = L.geoJSON(wicket.toJson(), {
					pointToLayer: function(geoJsonPoint, latlng) {
						return L.marker(latlng, { icon: L.AwesomeMarkers.icon({
							icon: 'help-buoy',
							markerColor: 'red'
						})
					});
					}
				})
				// console.log(L.geoJSON(wicket.toJson()))	
				if(determineActiveBuildings(intialSlider, newBinding)) {
					newBinding.geoJson
					.bindPopup(generatePopup(newBinding))
					.setStyle({color: "#ff0000"})
					.addTo(featuregroup)
					.on('click', onClick)	
				}
				
			} else{
				newBinding.geoJson = {_leaflet_id: -1}
			}
			return newBinding
		}
	)
	///sa
		return churches
	}).then((churches) => {
		churches.map((church) => {
			const buildingImages = `
			SELECT * WHERE {
				?image dct:spatial <${church.building.value}> .
				?image foaf:depiction ?depiction
			} LIMIT 10
			`
			sparqlQueryHandler.sendQuery(buildingImages)
			.then((data) => {
				church.images = data.results.bindings
				if(church.images.length > 0){
					church.geoJson.setStyle({color: "#33cc33"})
					try{
						if(church.geoJson._layers[(church.geoJson._leaflet_id-1)].feature.geometry.type === 'Point'){
							church.geoJson.clearLayers()
							church.geoJson = L.geoJSON(church.GeoJsonData, {
								pointToLayer: function(geoJsonPoint, latlng) {
									return L.marker(latlng, { icon: L.AwesomeMarkers.icon({
										icon: 'help-buoy',
										markerColor: 'green'
									})
								});
								}
							})
							church.geoJson
							.bindPopup(generatePopup(church))
							.addTo(featuregroup)
							.on('click', onClick)
						}	
					}
					catch(e) {console.log('fail')} //_layers.feature.geometry.type
				
				}})
			.catch((error) => console.log(error))
			// if(church.sameas){
			// 	let urlArray = church.sameas.value.split('/')
			// 	if(urlArray.includes('verdwenengebouwen.nl')){
			// 		urlArray.splice((urlArray.length - 1), 0, "json")
			// 		let jsonUrl = urlArray.join('/')
			// 		fetch("http://verdwenengebouwen.nl/gebouw/json/3569")
			// 		.then((data) => {console.log(data)})
			// 		// fetch(jsonUrl).then((data) => {console.log(data)})
			// 		// console.log(jsonUrl)

			// 	}
			// }
		})
	})



	function determineActiveBuildings(year, obj){

		let end = 2020
		let begin = 0
		try {
			end = obj.earliestEnd.value
		} catch(e){}
		try {
			begin = obj.earliestBegin.value
		} catch(e){}
		
		try{
		return(obj.earliestBegin.value-year < 10 && obj.earliestBegin.value-year > -1)
		}catch(e){return false}

		// return (year >= begin && year <= end) 
	}
	var i = 0;
	button.onclick = function() {

		slider.value = slider.min
		let incrementer = slider.min
		// output.innerHTML = slider.value
		if(intr){
			clearInterval(intr)
			return
		}
		 intr = setInterval(function(){
			slider.value = incrementer++
			featuregroup.clearLayers()
			churches.filter((church)=> {
				if(determineActiveBuildings(slider.value, church)) {
					try{church.geoJson.
					bindPopup(generatePopup(church))
					.addTo(featuregroup)
					.on('click', onClick)	
					}catch(e){}
					
				}
			})
			tooltipYear.updateYear()
			showSliderValue()
			// output.innerHTML = slider.value
			if(slider.value === slider.max){
				clearInterval(intr)
				intr = false
			}
		}, 50)

	}

	drawBuildBuildings = function() {
		featuregroup.clearLayers()
		churches.filter((church)=> {
			if(determineActiveBuildings(this.value, church)) {
				try{church.geoJson.
				bindPopup(generatePopup(church))
				.addTo(featuregroup)
				.on('click', onClick)	
				}catch{}	
			}
		})
	}



	slider.oninput = function() {
		// output.innerHTML = this.value
		tooltipYear.updateYear()
		featuregroup.clearLayers()
		churches.filter((church)=> {
			if(determineActiveBuildings(this.value, church)) {
				try{church.geoJson.
				bindPopup(generatePopup(church))
				.addTo(featuregroup)
				.on('click', onClick)	
				}catch(e){}
				
			}
		})

	}
	// Update the current slider value (each time you drag the slider handle)
	slider.onmouseup = function() {
		tooltipYear.updateYear()
		// 	output.innerHTML = slider.value	s
	} 
	button.onmousedown = function() {
		button.classList.toggle('pause')
		button.classList.toggle('play')
	}

	button.onkeyup = function(e) {
		if (e.which === 32) {
			button.toggle('pause')
			button.toggle('play')
		}
	}



	rangeSlider.addEventListener("input", showSliderValue, false);

		function showSliderValue() {
		rangeLabel.innerHTML = rangeSlider.value;
		var labelPosition = ((rangeSlider.value - rangeSlider.min)*3.19 / (rangeSlider.max));
		console.log(labelPosition)
		console.log(rangeLabel.style.left)
		if(rangeSlider.value === rangeSlider.min) {
			rangeLabel.style.left = ((labelPosition * 100) + 2) + "%";
		} else if (rangeSlider.value === rangeSlider.max) {
			rangeLabel.style.left = ((labelPosition * 100) - 2) + "%";
		} else {
			rangeLabel.style.left = (labelPosition * 100) + "%";
		}
	}

}