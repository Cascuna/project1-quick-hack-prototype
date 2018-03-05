{
    let limit = 100
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
	 
	var encodedquery = encodeURIComponent(sparqlquery);

	var queryurl = 'https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedquery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
	fetch(queryurl)
	.then((resp) => resp.json()) // transform the data into json
  	.then(function(data) {
		console.log(data)
		for(let bind of data.results.bindings){
			console.log(bind.typelink.value)
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
				console.log(data)
			})
		}
	})
	.catch(function(error) {
		console.log(error);
	});

}