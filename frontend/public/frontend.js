document.getElementById("listButton").addEventListener("click", handleList);
document.getElementById("removeDataset").addEventListener("click", handleRemove);
document.getElementById("addDataset").addEventListener("click", handleAdd);

function handleAdd() {

	let xhttp = new XMLHttpRequest();
	console.log("start of add function");
	xhttp.onloadend = function () {
		if (xhttp.status === 400) {
			alert("Dataset ID or Kind that you entered is not valid!. Dataset ID cannot have underscores or whitespaces." +
				" Dataset Kind can either be courses or rooms :)");
		} else if (xhttp.status === 200) {
			let res = JSON.parse(xhttp.response);
			alert("Database now contains " + res.result);
			document.getElementById('results').innerHTML;
			document.getElementById("listButton").click();
		}
	};

	let formData = new FormData(document.getElementById("myForm"));
	let id = formData.get("addThis");
	let kind = formData.get("datasetKind");
	let file = formData.get("myFile");
	console.log(file);
	console.log(document.getElementById("myFile"));
	for(let pair of formData.entries()) {
		console.log(pair[0]+ ', '+ pair[1]);
	}

	xhttp.open("PUT", "http://localhost:4321/dataset/" + id + "/" + kind, true);
	xhttp.send(file);
}

function handleList() {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if (this.readyState === 4 && this.status == 200) {
			// do nothing here
		}
	};
	xhttp.open("GET", "http://localhost:4321/datasets", true);
	xhttp.send();
	xhttp.onload = function (e) {
		if (this.status >= 200) { // if the HTTP response code is 200 (OK)
			console.log(xhttp.response);
			printResults(xhttp.response);
			// document.getElementById('results').innerHTML = xhttp.response;
		}
	};
	console.log("here");
};

function printResults(data) {
	let val = JSON.parse(data);
	val = val["result"];
	console.log(val);
	document.getElementById("results").innerHTML = "";
	let mainContainer = document.getElementById("results");
	if (val.length === 0) {
		// var div = document.createElement("div-res");
		// div.innerHTML = "";
		alert("List is empty");
	} else {
		for (let i = 0; i < val.length; i++) {
			let div = document.createElement("div-res");
			div.innerHTML = '</h2><strong>ID: </strong>' + val[i].id + ', <strong>NumRows</strong>: ' + val[i].numRows + '<br>';
			mainContainer.appendChild(div);
		}
	}
}

function handleRemove() {
	let xhttp = new XMLHttpRequest();
	console.log("start of remove function");
	xhttp.onreadystatechange = function () {
		//
	};
	let id = document.getElementById("removeThis").value;
	xhttp.open("DELETE", "http://localhost:4321/dataset/" + id, true);
	xhttp.send();
	xhttp.onloadend = function () {
		if (xhttp.status === 404) {
			alert("Error 404: Dataset you are trying to remove does not exist! Please check for typos :)");
		} else if (xhttp.status === 400) {
			alert("Dataset ID that you entered is not valid!. Please remove any whitespaces or underscores :)")
		} else if (xhttp.status === 200) {
			let res = JSON.parse(xhttp.response);
			alert("Succesfully removed dataset '" + res.result + "' from the database");
			document.getElementById('results').innerHTML = '';
			document.getElementById("listButton").click();
		}
	}
};

function handleQuery(){
	xhttp.open("POST", "http://localhost:4321/dataset/" + id + "/" + kind, true);
	xhttp.send(file);
}
