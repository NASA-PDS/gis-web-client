function getData() {
    /**
     * Gets the data from the pds4 registry
     */

    fetch(getUrl())
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

        let productType = "";
        if (data[i]["type"].toLowerCase() === "product_service") {
            const serviceTypeKey = "pds:Service.pds:service_type";
            let service_type = data[i].properties[serviceTypeKey][0];

            if (service_type === "OGC WMS") {
                let offset = data.length;
                getWMSXML(data[i], offset, query);
            }

            productType = "WMTS";
        }
        else if (data[i]["type"].toLowerCase() === "product_external") {
            productType = "LAZ";
        }

        // if search is active, search for matching substr in description or title
        if (query) {
            query = String(query).toLowerCase();

            // get correct description based on pds4 product type
            let description = "";
            if (productType === "WMTS") {
                const descriptionKey = "pds:Service.pds:abstract_desc";
                description = String(data[i].properties[descriptionKey][0]).toLowerCase();
            }
            else if (productType === "LAZ") {
                const descriptionKey = "description";
                description = String(data[i].properties[descriptionKey][0]).toLowerCase();
            }

            const layerName = data[i].title;

            if (!(description.includes(query)) &&
                !(layerName.includes(query))) {
                continue;
            }
        }

        let layer = data[i];
        let option = document.createElement("option");
        option.textContent = layer.title + " - " + productType;
        option.id = layer.title;
        option.value = i;
        dropdown.appendChild(option);
    }

}


function submitLayerForm(event) {
    /**
     * Handles dropdown from submit
     */
    event.preventDefault();

    fetch(getUrl())
    .then(response => response.json())
    .then(out => {
        // check if wms is being added
        // wms layers have value > data length
        if (event.srcElement[0].value > out.data.length) {
            let childrenLen = event.srcElement[0].children.length;

            // find child with layer and wms info
            for (let i = 0; i < childrenLen; i++) {
                let child = event.srcElement[0].children[i];

                if (child.value === event.srcElement[0].value) {

                    const layerData = {
                        layerTitle: child.textContent,
                        layerName: child.id,
                        wmsUrl: child.href,
                        lidvid: child.className
                    };

                    addWMSLayer(layerData, out, event);
                }
            }
        }
        else {
            const layerData = out.data[event.srcElement[0].value];

            if (layerData["type"].toLowerCase() === "product_service") {
                addWMTSLayer(layerData, out, event);
            }
            else if (layerData["type"].toLowerCase() === "product_external") {
                addLAZLayer(layerData, out, event);
            }
        }

        // display layers to user
        if (document.getElementById("layer-list-title").textContent === "") {
            // title
            document.getElementById("layer-list-title").textContent = "Added Layers:";

            // export all button
            let exportAllButtonContainer = document.getElementById("export-all-container");
            let exportAllButton = document.createElement("button");
            exportAllButton.className = "user-input";
            exportAllButton.id = "export-all-button";
            exportAllButton.onclick = onExportAllButton;
            exportAllButton.textContent = "Export All To QGIS";
            exportAllButtonContainer.appendChild(exportAllButton);

            // remove button
            let removeButtonContainer = document.getElementById("remove-button-container");
            let removeButton = document.createElement("button");
            removeButton.className = "user-input";
            removeButton.id = "remove-button";
            removeButton.onclick = onRemoveButton;
            removeButton.textContent = "Remove Layer";
            removeButtonContainer.appendChild(removeButton);
        }

    })
    .catch(err => console.log(err));
}


function addWMTSLayer(layerData, out, event) {
    /**
     * Adds a wmts layer to the demo
     */
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
            format: format
        }).addTo(map);

        // add layer to list
        layers.push(currLayer);
        console.log("Layers: " + layers.length);

        let layerListElement = document.getElementById("layer-list");

        // create element wrapper
        let layerElement = document.createElement("div");
        layerElement.className = "layer-element-wrapper";

        // layer link
        let layerPDS4Link = document.createElement("a");
        layerPDS4Link.className = "layer-link";
        layerPDS4Link.href = "http://localhost:8080/products/" + layerData.properties["lidvid"][0];
        layerPDS4Link.target = "_blank";  // open in new window
        layerPDS4Link.textContent = out.data[event.srcElement[0].value].title;
        layerPDS4Link.id = out.data[event.srcElement[0].value].title;

        layerElement.appendChild(layerPDS4Link);

        layerListElement.appendChild(layerElement);

    })
    .catch(err => console.log(err));
}


function addWMSLayer(layerData, out, event) {
    console.log(layerData);
    var currLayer = L.tileLayer.wms("https://webmap.lroc.asu.edu/?BODY=luna", {
        layers: layerData.layerName,
        transparent: true,
        format: "image/png"
    }).addTo(map);


    // add layer to list
    layers.push(currLayer);
    console.log("Layers: " + layers.length);

    wmsLayers.names.push(layerData.layerName);
    wmsLayers.titles.push(layerData.layerTitle);

    let layerListElement = document.getElementById("layer-list");

    // create element wrapper
    let layerElement = document.createElement("div");
    layerElement.className = "layer-element-wrapper";

    // layer link
    let layerPDS4Link = document.createElement("a");
    layerPDS4Link.className = "layer-link";
    layerPDS4Link.href = "http://localhost:8080/products/" + layerData.lidvid;
    layerPDS4Link.target = "_blank";  // open in new window
    layerPDS4Link.textContent = layerData.layerTitle;
    layerPDS4Link.id = layerData.layerName;

    layerElement.appendChild(layerPDS4Link);

    // create qgis file
    const wms = {names: [layerData.layerName], titles: [layerData.layerTitle]}
    const file = new File([createQGSFIle(null, wms)], layerData.layerTitle + ".qgs", {
        type: 'text/plain',
    });

    let qgsId = layerData.layerName + "_qgs";
    files[qgsId] = file;
    let fileUrl = URL.createObjectURL(file);

    // export to qgis button
    let exportQGISButton = document.createElement("a");
    exportQGISButton.href = fileUrl;
    exportQGISButton.id = qgsId;
    exportQGISButton.className = "user-input";
    exportQGISButton.textContent = "Export to QGIS";
    exportQGISButton.download = file.name;
    layerElement.appendChild(exportQGISButton);

    layerListElement.appendChild(layerElement);
}


function addLAZLayer(layerData, out, event) {
    /**
     * Adds a laz layer to the demo
     */
    const lolaFileUrlKey = "pds:File.pds:file_URL";
    let lolaFileUrl = layerData.properties[lolaFileUrlKey ][0];

    var currLayer = L.tileLayer(lolaFileUrl, {
    }).addTo(map);

    // add layer to list
    layers.push(currLayer);
    console.log("Layers: " + layers.length);

    let layerListElement = document.getElementById("layer-list");

    // create element wrapper
    let layerElement = document.createElement("div");
    layerElement.className = "layer-element-wrapper";

    // layer link
    let layerPDS4Link = document.createElement("a");
    layerPDS4Link.className = "layer-link";
    layerPDS4Link.href = "http://localhost:8080/products/" + layerData.properties["lidvid"][0];
    layerPDS4Link.target = "_blank";  // open in new window
    layerPDS4Link.textContent = out.data[event.srcElement[0].value].title;
    layerPDS4Link.id = out.data[event.srcElement[0].value].title;
    layerElement.appendChild(layerPDS4Link);

    let layerName = out.data[event.srcElement[0].value].title;
    lazLayers.dataURLs.push(lolaFileUrl);
    lazLayers.names.push(layerName);
    console.log(lazLayers);

    // create qgis file
    const laz = {dataURLs: [lolaFileUrl], names: [layerName]}
    const file = new File([createQGSFIle(laz, null)], out.data[event.srcElement[0].value].title + ".qgs", {
        type: 'text/plain',
    });

    let qgsId = out.data[event.srcElement[0].value].title + "_qgs";
    files[qgsId] = file;
    let fileUrl = URL.createObjectURL(file);

    // export to qgis button
    let exportQGISButton = document.createElement("a");
    exportQGISButton.href = fileUrl;
    exportQGISButton.id = qgsId;
    exportQGISButton.className = "user-input";
    exportQGISButton.textContent = "Export to QGIS";
    exportQGISButton.download = file.name;
    layerElement.appendChild(exportQGISButton);

    layerListElement.appendChild(layerElement);

}


function searchLayerForm(event) {
    event.preventDefault();
    getData();
}


function getWMSXML(data, offset, query) {
    /**
     * Gets the WMS Get Capabilities xml and
     */
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE
            && xmlhttp.status == 200) {
            parseWMSCapabilities(xmlhttp, data, offset, query);
        }
    };

    const getCapabilitiesURLKey = "pds:Service.pds:url";
    let getCapabilitiesURL = data.properties[getCapabilitiesURLKey][0];
    xmlhttp.open("GET", getCapabilitiesURL, true);
    xmlhttp.send();
}


function parseWMSCapabilities(xml, data, offset, query) {
    /**
     * Parses through the get capabilities of WMS pds4
     */
    parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xml.responseText,"text/xml");

    let x = xmlDoc.getElementsByTagName("Layer");

    let dropdown = document.getElementById("titan-layers-dropdown");

    // i = 0 is only srs information
    for (let i = 1; i < x.length; i++) {
        let layer = x[i];
        let layerTitle = layer.getElementsByTagName("Title")[0].textContent;
        let layerName = layer.getElementsByTagName("Name")[0].textContent;
        let layerAbstract = layer.getElementsByTagName("Abstract")[0].textContent;

        if (query) {
            if (!(layerTitle.includes(query)) &&
                !(layerName.includes(query)) &&
                !(layerAbstract.includes(query))) {
                continue;
            }
        }
        let option = document.createElement("option");
        option.textContent = layerTitle + " - WMS";
        option.id = layerName;
        option.value = i + offset;
        option.href = data.properties["pds:Service.pds:url"][0];
        option.className = data.properties["lidvid"][0];

        dropdown.append(option);
    }

}


function onExportAllButton(event) {
    /**
     * Handles export all button press
     */

    // create qgis file
    const file = new File([createQGSFIle(lazLayers, wmsLayers)], "demo-layers.qgs", {
        type: 'text/plain',
    });

    let qgsId = "all_layers_qgs";
    files[qgsId] = file;
    let fileURL = URL.createObjectURL(file);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = fileURL;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(fileURL);
}


function onRemoveButton(event) {
    /**
     * Handles remove layer button click
     */
    var layer = layers.pop();
    map.removeLayer(layer);
    console.log(layer);

    // check if lola layer, and remove if so
    if (layer._url.slice(-3) === "laz") {
        lazLayers.names.pop();
        lazLayers.dataURLs.pop();
    }

    // check if wms layer
    if (layer.options.layers != null) {
        wmsLayers.names.pop();
        wmsLayers.titles.pop();
    }

    let layerListElement = document.getElementById("layer-list");
    layerListElement.removeChild(layerListElement.lastChild);

    if (layers.length === 0) {
        document.getElementById("layer-list-title").textContent = "";
        document.getElementById("export-all-button").remove();
        document.getElementById("remove-button").remove();
    }
}


function getUrl() {
    /**
     * Gets the URL with the query for the selected target
     */

    let targetDropdown = document.getElementById("target-dropdown");
    let target = targetDropdown.value;

    const target_map = {
        "Mars": "q=(ref_lid_target eq \"urn:nasa:pds:context:target:planet.mars\")&limit=10000",
        "Mercury": "q=(ref_lid_target eq \"urn:nasa:pds:context:target:planet.mercury\")&limit=10000",
        "Venus": "q=(ref_lid_target eq \"urn:nasa:pds:context:target:planet.venus\")&limit=10000",
        "Moon": "q=(ref_lid_target eq \"urn:nasa:pds:context:target:satellite.earth.moon\")&limit=10000",
        "Phobos": "q=(ref_lid_target eq \"urn:nasa:pds:context:target:satellite.mars.phobos\")&limit=10000",
        "Titan": "q=(ref_lid_target eq \"urn:nasa:pds:context:target:satellite.saturn.titan\")&limit=10000",
        "Ceres": "q=(pds:Target_Identification.pds:name eq \"Ceres\")&limit=10000",  // lid_ref was not found in pds
        "Ryugu": "q=(pds:Target_Identification.pds:name eq \"Ryugu\")&limit=10000",
        "Vesta": "q=(pds:Target_Identification.pds:name eq \"Vesta\")&limit=10000"
    }

    let pdsQuery = target_map[target];

    const url = "http://localhost:8080/products?" + pdsQuery;

    console.log(url);
    return url;
}


function createQGSFIle(laz, wms) {
    /**
     * Returns filled in template for qgs file
     */
    // unpack laz params
    let exportLaz = false;
    let lazNames = null;
    let lazURLs = null;
    if (laz != null) {
        lazNames = laz.names;
        lazURLs = laz.dataURLs;
        exportLaz = true;
    }

    // upack wms params
    let exportWms = false;
    let wmsNames = null;
    let wmsTitles = null;
    if (wms != null) {
        wmsNames = wms.names;
        wmsTitles = wms.titles;
        exportWms = true;
    }

    // initialize project
    let qgsFile = `<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
    <qgis version="3.34.9-Prizren" saveUserFull="JPL" projectname="" saveUser="jpl" saveDateTime="2024-08-02T13:01:41">
    <homePath path=""/>
    <title>Demo Lola Layers</title>
    <transaction mode="Disabled"/>
    <projectFlags set=""/>
    <projectCrs>
        <spatialrefsys nativeFormat="Wkt">
        <wkt>GEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble",MEMBER["World Geodetic System 1984 (Transit)"],MEMBER["World Geodetic System 1984 (G730)"],MEMBER["World Geodetic System 1984 (G873)"],MEMBER["World Geodetic System 1984 (G1150)"],MEMBER["World Geodetic System 1984 (G1674)"],MEMBER["World Geodetic System 1984 (G1762)"],ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1]],ENSEMBLEACCURACY[2.0]],PRIMEM["Greenwich",0,ANGLEUNIT["degree",0.0174532925199433]],CS[ellipsoidal,2],AXIS["geodetic latitude (Lat)",north,ORDER[1],ANGLEUNIT["degree",0.0174532925199433]],AXIS["geodetic longitude (Lon)",east,ORDER[2],ANGLEUNIT["degree",0.0174532925199433]],USAGE[SCOPE["Horizontal component of 3D system."],AREA["World."],BBOX[-90,-180,90,180]],ID["EPSG",4326]]</wkt>
        <proj4>+proj=longlat +datum=WGS84 +no_defs</proj4>
        <srsid>3452</srsid>
        <srid>4326</srid>
        <authid>EPSG:4326</authid>
        <description>WGS 84</description>
        <projectionacronym>longlat</projectionacronym>
        <ellipsoidacronym>EPSG:7030</ellipsoidacronym>
        <geographicflag>true</geographicflag>
        </spatialrefsys>
    </projectCrs>\n`;

    // create layer tree group
    let layerTreeGroup = `<layer-tree-group>\n`;
    let customOrder = `<custom-order enabled="0">\n`;

    if (exportLaz) {
        for(let i = 0; i < lazNames.length; i++) {
            let name = lazNames[i];
            let url = lazURLs[i];
            let id = `${name}_661150f5_9e6e_42e0_a975_171e332cf765`;

            let layerTreeLayer = `<layer-tree-layer name="${name}" source="${url}" patch_size="-1,-1" legend_split_behavior="0" checked="Qt::Checked" expanded="1" id="${id}" providerKey="copc" legend_exp=""></layer-tree-layer>\n`;
            layerTreeGroup += layerTreeLayer;

            let customOrderItem = `<item>${id}</item>\n`;
            customOrder += customOrderItem;
        }
    }

    if (exportWms) {
        for(let i = wmsNames.length-1; i >= 0; i--) {
            let name = wmsNames[i];
            let title = wmsTitles[i];
            let id = `_00000000_0000_0000_0000_00000000000${i}`;

            let layerTreeLayer = `<layer-tree-layer id="${id}" legend_split_behavior="0" source="contextualWMSLegend=0&amp;crs=EPSG:4326&amp;dpiMode=7&amp;featureCount=10&amp;format=image/png&amp;layers=${name}&amp;styles&amp;tilePixelRatio=0&amp;url=https://webmap.lroc.asu.edu/?BODY%3Dluna" checked="Qt::Checked" name="${title}" providerKey="wms" legend_exp="" patch_size="-1,-1" expanded="1"></layer-tree-layer>\n`;
            layerTreeGroup += layerTreeLayer;

            let customOrderItem = `<item>${id}</item>\n`;
            customOrder += customOrderItem;
        }
    }

    customOrder += `</custom-order>\n`;
    layerTreeGroup += customOrder;
    layerTreeGroup += `</layer-tree-group>\n`;

    qgsFile += layerTreeGroup;

    // create project layers
    let projectLayers = `<projectlayers>\n`;

    if (exportLaz) {
        for(let i = 0; i < lazNames.length; i++) {
            let name = lazNames[i];
            let url = lazURLs[i];
            let id = `${name}_661150f5_9e6e_42e0_a975_171e332cf765`;

            let mapLayer = `<maplayer minScale="100000000" refreshOnNotifyMessage="" legendPlaceholderImage="" maxScale="0" autoRefreshTime="0" type="point-cloud" autoRefreshMode="Disabled" sync3DRendererTo2DRenderer="1" styleCategories="AllStyleCategories" refreshOnNotifyEnabled="0" hasScaleBasedVisibilityFlag="0">\n`;

            let mapLayerId = `<id>${id}</id>\n`;
            let datasource = `<datasource>${url}</datasource>\n`;
            let layerName = `<layername>${name}</layername>\n`;
            let provider = `<provider>copc</provider>\n`;

            mapLayer += mapLayerId;
            mapLayer += datasource;
            mapLayer += layerName;
            mapLayer += provider;
            mapLayer += `</maplayer>\n`;

            projectLayers += mapLayer;
        }
    }

    if (exportWms) {
        for(let i = 0; i < wmsNames.length; i++) {
            let name = wmsNames[i];
            let title = wmsTitles[i];
            let id = `_00000000_0000_0000_0000_00000000000${i}`;

            let mapLayer = `<maplayer refreshOnNotifyEnabled="0" legendPlaceholderImage="" type="raster" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" maxScale="0" minScale="1e+08" autoRefreshTime="0" refreshOnNotifyMessage="" autoRefreshMode="Disabled">\n`;

            let mapLayerId = `<id>${id}</id>\n`;
            let datasource = `<datasource>contextualWMSLegend=0&amp;crs=EPSG:4326&amp;dpiMode=7&amp;featureCount=10&amp;format=image/png&amp;layers=${name}&amp;styles&amp;tilePixelRatio=0&amp;url=https://webmap.lroc.asu.edu/?BODY%3Dluna</datasource>\n`;
            let layerName = `<layername>${title}</layername>\n`;
            let provider = `<provider>wms</provider>\n`;

            mapLayer += mapLayerId;
            mapLayer += datasource;
            mapLayer += layerName;
            mapLayer += provider;
            mapLayer += `</maplayer>\n`;

            projectLayers += mapLayer;
        }
    }

    projectLayers += `</projectlayers>\n`

    qgsFile += projectLayers;

    // create layer order
    let layerOrder = `<layerorder>\n`;
    if (exportLaz) {
        for(let i = 0; i < lazNames.length; i++) {
            let name = lazNames[i];
            let id = `${name}_661150f5_9e6e_42e0_a975_171e332cf765`;

            let layer = `<layer id="${id}"/>\n`;
            layerOrder += layer;
        }
    }

    if (exportWms) {
        for(let i = wmsNames.length-1; i >= 0; i--) {
            let id = `_00000000_0000_0000_0000_00000000000${i}`;
            let layer = `<layer id="${id}"/>\n`;
            layerOrder += layer;
        }
    }
    layerOrder += `</layerorder>\n`;

    qgsFile += layerOrder;
    qgsFile += `</qgis>`;

    return qgsFile;
}


// initialize map
var map = L.map('map', {
    crs: L.CRS.EPSG4326
});

map.setView([0,0], 1);

let layers = [];
let files = {};
let lazLayers = {names: [], dataURLs: []};
let wmsLayers = {names: [], titles: []};

// get layers from pds4 registry and initialize dropdown
getData();

var layerSelectForm = document.getElementById("select-layer-form");
layerSelectForm.addEventListener('submit', submitLayerForm);

var layerSearchForm = document.getElementById("search-pds4-form");
layerSearchForm.addEventListener('submit', searchLayerForm);
