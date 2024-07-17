function getData() {
    /**
     * Gets the data from the pds4 registry
     */

    fetch(url)
    .then(response => response.json())
    .then(out => {
        console.log(out);
                populateDropdown(out.data);

    })
    .catch(err => console.log(err));
}

function populateDropdown(data) {
    /**
     * populates the dropdown menu with the given data
     */

    // get dropdown
    let dropdown = document.getElementById("titan-layers-dropdown");
    dropdown.innerHTML = null;

    // populate dropdown with pds data
    for (let i = 0; i < data.length; i++) {
        // check if search is active
        let search = document.getElementById("search");
        let query = search.value;

        // if search is active, search for matching substr in description
        if (query) {
            const description_key = "pds:Service.pds:abstract_desc";
            const description = String(data[i].properties[description_key][0]).toLowerCase();
            query = String(query).toLowerCase();

            if (!(description.includes(query))) {
                continue;
            }
        }

        let layer = data[i];
        let option = document.createElement("option");
        option.textContent = layer.title;
        option.id = layer.title;
        option.value = i;
        dropdown.appendChild(option);
    }

}


function submitLayerForm(event){
    /**
     * Handles dropdown from submit
     */
    event.preventDefault();

    fetch(url)
    .then(response => response.json())
    .then(out => {
        const layerData = out.data[event.srcElement[0].value];

        console.log(layerData);

        const pds4UrlKey = "pds:Service.pds:url";
        let wmtsUrl = layerData.properties[pds4UrlKey][0];

        // get xml string
        fetch(wmtsUrl)
        .then((response) => response.text())
        .then((xmlString) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const capabilitiesNode = xmlDoc.querySelector("Capabilities");
            const contentsNode = capabilitiesNode.querySelector("Contents");

            // get layer info
            const layerNode = contentsNode.querySelector("Layer");

            // style
            const styleNode = layerNode.querySelector("Style");
            const style = styleNode.querySelector("Identifier").textContent;

            // tile matrix set
            const tmsl = layerNode.querySelector("TileMatrixSetLink");
            const tileMatrixSet = tmsl.querySelector("TileMatrixSet").textContent;

            // format
            const format = layerNode.querySelector("Format").textContent;

            // url
            let resourceURLNode = layerNode.querySelector("ResourceURL");
            var imageURL = resourceURLNode.getAttribute("template");

            // format url
            imageURL = imageURL.replace("{Style}", style);
            imageURL = imageURL.replace("{TileMatrixSet}", tileMatrixSet);
            imageURL = imageURL.replace("{TileMatrix}", "{z}")
            imageURL = imageURL.replace("{TileRow}", "{y}")
            imageURL = imageURL.replace("{TileCol}", "{x}")
            console.log(imageURL);

            var currLayer = L.tileLayer(imageURL, {
                format: format,
            }).addTo(map);

            // add layer to list
            layers.push(currLayer);
            console.log("Layers: " + layers.length);

            // display layers to user
            if (document.getElementById("layer-list-title").textContent === "") {
                document.getElementById("layer-list-title").textContent = "Added Layers:";
                var buttonContainer = document.getElementById("button-container");
                var button = document.createElement("button");
                button.className = "user-input";
                button.id = "remove-button";
                button.onclick = onRemoveButton;
                button.textContent = "Remove Layer";
                buttonContainer.appendChild(button);
            }
            // <button id="remove-button" class="user-input" onclick="onRemoveButton()">Remove Layer</button>
            let layerListElement = document.getElementById("layer-list");
            let layerElement = document.createElement("a");
            layerElement.href = "http://localhost:8080/products/" + layerData.properties["lidvid"][0];  // pds4 metadata url
            layerElement.target = "_blank";  // open in new window
            layerElement.textContent = out.data[event.srcElement[0].value].title;
            layerElement.id = out.data[event.srcElement[0].value].title;
            layerListElement.appendChild(layerElement);
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
}

function onRemoveButton(event) {
    /**
     * Handles remove layer button click
     */
    var layer = layers.pop();
    console.log(layer);
    console.log(layers);
    map.removeLayer(layer);

    let layerListElement = document.getElementById("layer-list");
    layerListElement.removeChild(layerListElement.lastChild);

    if (layers.length === 0) {
        document.getElementById("layer-list-title").textContent = "";
        document.getElementById("remove-button").remove();
    }
}


// initialize url
const url = "http://localhost:8080/products?q=(product_class eq \"Product_Service\")";

// initialize map
var map = L.map('map');
map.setMaxZoom(3);
map.setMinZoom(0);
map.setView([0,0], 0);

// initialize basemap
var basemapURL = "https://trek.nasa.gov/tiles/Titan/EQ/TitanISS2018June.proj.scale/1.0.0//default/default028mm/{z}/{y}/{x}.jpg"
var basemap = L.tileLayer(basemapURL, {
    format: "image/jpeg"
}).addTo(map);

let layers = []

// get layers from pds4 registry and initialize dropdown
getData();

var layerSelectForm = document.getElementById("select-layer-form");
var searchPDS4Form = document.getElementById("search-pds4-form");
var removeButton = document.getElementById("remove-button");

layerSelectForm.addEventListener('submit', submitLayerForm);
