const express = require('express');
const router = express.Router();
const multer = require('multer');
const suggestedData = require('../models/suggestedDataModel');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'suggested_data/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }
});
const upload = multer({ storage: storage });

router.post('/', (req, res) => {
    console.log(req.body);
    var newSuggestedData = new suggestedData({
        title: req.body.title,
        data: req.body.data,
        createdby: req.body.useremail,
        state: 'Pending'
    });
    newSuggestedData.save(function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully saved!");
            console.log(data);
        }
    });
});

router.get('/fetchData', (req, res) => {
    suggestedData.find({}, function (err, fetch) {
        console.log(fetch)
    });
});

router.post('/approveData', (req, res) => {
    suggestedData.findById({ _id: req.body.data_id }, function (err, approve) {
        if (approve.title === 'Airports') {
            fs.readFile(process.cwd() + "/raw_data/airports.json", (err, file) => {
                const head = approve.data["Airport Code"];
                const jsonHead = head.toUpperCase();
                const lat = approve.data["lat"];
                const lon = approve.data["lon"];
                let jsonArray = JSON.parse(file);
                jsonArray[jsonHead] = { "lat": parseInt(lat), "lon": parseInt(lon) };
                fs.writeFile(process.cwd() + "/raw_data/airports.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
            });
        } else if (approve.title === "Appliances Data") {
            fs.readFile(process.cwd() + "/raw_data/appliances.json", (err, file) => {
                const appliance = approve.data["Appliance"];
                const diss = approve.data['Average_watts (in Wh)'];
                const place = approve.data['place'];
                let jsonArray = JSON.parse(file);
                jsonArray.push({ "Appliance": appliance, "Average_watts (in Wh)": parseInt(diss) });
                fs.writeFile(process.cwd() + "/raw_data/appliances.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
                fs.readFile(process.cwd() + "/client/public/data/appliances.json", (err, file) => {
                    let jarray = JSON.parse(file);
                    data = {
                        "item": appliance,
                        "val": "" + diss
                    };
                    jarray[place].push(data)
                    fs.writeFile(process.cwd() + "/client/public/data/appliances.json", JSON.stringify(jarray), (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("successfully added to front-end data");

                        }
                    })
                })
            });
        } else if (approve.title === "Country Code") {
            fs.readFile(process.cwd() + "/raw_data/countrycode.json", (err, file) => {
                const name = approve.data["name"];
                const code = approve.data["code"];
                let jsonArray = JSON.parse(file);
                jsonArray.push({ "name": name, "code": code.toUpperCase() });
                fs.writeFile(process.cwd() + "/raw_data/countrycode.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
            });
        } else if (approve.title === "Electricity Emission") {
            fs.readFile(process.cwd() + "/raw_data/electricity_emission.json", (err, file) => {
                const country = approve.data["Country"];
                const code = approve.data["code"];
                const genCO2 = approve.data["Generation-CO2"];
                const genCH4 = approve.data["Generation-CH4"];
                const genN2O = approve.data["Generation-N2O"];
                const tdCO2 = approve.data["Td-CO2"];
                const tdCH4 = approve.data["Td-CH4"];
                const tdN2O = approve.data["Td-N2O"];
                const consumCO2 = approve.data["Consum-CO2"];
                const consumCH4 = approve.data["Consum-CH4"];
                const consumN20 = approve.data["Consum-N2O"];
                let jsonArray = JSON.parse(file);
                const data = {
                    "Country": country,
                    "Generation-CO2": "" + genCO2,
                    "Generation-CH4": "" + genCH4,
                    "Generation-N2O": "" + genN2O,
                    "Td-CO2": "" + tdCO2,
                    "Td-CH4": "" + tdCH4,
                    "Td-N2O": "" + tdN2O,
                    "Consum-CO2": "" + consumCO2,
                    "Consum-CH4": "" + consumCH4,
                    "Consum-N2O": "" + consumN20
                }
                jsonArray.push(data)
                fs.writeFile(process.cwd() + "/raw_data/electricity_emission.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
                fs.readFile(process.cwd() + "/raw_data/electricity.json", (err, file) => {
                    let obj1 = {
                        "item": "generation",
                        "region": data["Country"],
                        "quantity": 1,
                        "units": "kWh",
                        "categories": ["electricity"],
                        "components": [
                            { "name": "CO2", "quantity": parseFloat(data["Generation-CO2"]), "units": "kg CO2/kWh" },
                            { "name": "CH4", "quantity": parseFloat(data["Generation-CH4"]), "units": "kg CH4/kWh" },
                            { "name": "N2O", "quantity": parseFloat(data["Generation-N2O"]), "units": "kg N2O/kWh" }
                        ]
                    }
                    let obj2 = {
                        "item": "td",
                        "region": data["Country"],
                        "quantity": 1,
                        "units": "kWh",
                        "categories": ["electricity"],
                        "components": [
                            { "name": "CO2", "quantity": parseFloat(data["Td-CO2"]), "units": "kg CO2/kWh" },
                            { "name": "CH4", "quantity": parseFloat(data["Td-CH4"]), "units": "kg CH4/kWh" },
                            { "name": "N2O", "quantity": parseFloat(data["Td-N2O"]), "units": "kg N2O/kWh" }
                        ]
                    }
                    let elecArray = JSON.parse(file);
                    elecArray.push(obj1, obj2);
                    fs.writeFile(process.cwd() + "/raw_data/electricity.json", JSON.stringify(elecArray), (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("successfully approved");
                        }
                    });
                });
                fs.readFile(process.cwd() + "/client/public/data/electricity.json", (err, file) => {
                    let jarray = JSON.parse(file);
                    jarray[code] = {
                        "name": country,
                        "CO2": "" + (genCO2 + tdCO2),
                        "CH4": "" + (genCH4 + tdCH4),
                        "N2O": "" + (genN2O + tdN2O),
                        "unit": "kg/kWh"
                    }
                    let newj = {};
                    Object.keys(jarray)
                        .sort()
                        .forEach(function (v, i) {
                            console.log(v, jarray[v]);
                            newj[v] = jarray[v];
                        });
                    fs.writeFile(process.cwd() + "/client/public/data/electricity.json", JSON.stringify(newj), (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("successfully added to front-end data");
                        }
                    });
                })
            });
        } else if (approve.title === "Flights") {
            fs.readFile(process.cwd() + "/raw_data/flights.json", (err, file) => {
                const d1 = approve.data["125"];
                const d2 = approve.data["250"];
                const d3 = approve.data["500"];
                const d4 = approve.data["750"];
                const d5 = approve.data["1000"];
                const d6 = approve.data["1500"];
                const d7 = approve.data["2000"];
                const d8 = approve.data["2500"];
                const d9 = approve.data["3000"];
                const d10 = approve.data["3500"];
                const d11 = approve.data["4000"];
                const d12 = approve.data["4500"];
                const d13 = approve.data["5000"];
                const d14 = approve.data["5500"];
                const d15 = approve.data["6000"];
                const d16 = approve.data["6500"];
                const d17 = approve.data["7000"];
                const d18 = approve.data["7500"];
                const d19 = approve.data["8000"];
                const d20 = approve.data["8500"];
                const model = approve.data["airplane model"];
                let jsonArray = JSON.parse(file);
                const data = {
                    "125": d1,
                    "250": d2,
                    "500": d3,
                    "750": d4,
                    "1000": d5,
                    "1500": d6,
                    "2000": d7,
                    "2500": d8,
                    "3000": d9,
                    "3500": d10,
                    "4000": d11,
                    "4500": d12,
                    "5000": d13,
                    "5500": d14,
                    "6000": d15,
                    "6500": d16,
                    "7000": d17,
                    "7500": d18,
                    "8000": d19,
                    "8500": d20,
                    "airplane model": model
                };
                jsonArray.push(data)
                fs.writeFile(process.cwd() + "/raw_data/flights.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
                fs.readFile(process.cwd() + "/client/public/data/flights.json", (err, file) => {
                    let jarray = JSON.parse(file);
                    jarray[model] = data;
                    const newdata = {};
                    Object.keys(jarray)
                        .sort()
                        .forEach(function (v, i) {
                            newdata[v] = jarray[v];
                        })
                    fs.writeFile(process.cwd() + "/client/public/data/flights.json", JSON.stringify(newdata), (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("successfully appended to front-end data");
                        }
                    });
                });
            });
        } else if (approve.title === "Fuels") {
            fs.readFile(process.cwd() + "/raw_data/fuels.json", (err, file) => {
                const fname = approve.data["Fuel"];
                const langKey = approve.data["langKey"];
                const coem = approve.data["CO2Emission"];
                const chem = approve.data["CH4Emission"];
                const noem = approve.data["N2OEmission"];
                const ghgem = approve.data["GHGEmission"];
                const comment = approve.data["_comments"];
                let jsonArray = JSON.parse(file);
                jsonArray[fname] = {
                    "langKey": langKey,
                    "CO2Emission": "" + coem,
                    "CH4Emission": "" + chem,
                    "N2OEmission": "" + noem,
                    "GHGEmission": "" + ghgem,
                    "_comments": comment
                };
                fs.writeFile(process.cwd() + "/raw_data/fuels.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
            });
        } else if (approve.title === "Per Capita") {
            fs.readFile(process.cwd() + "/raw_data/percap.json", (err, file) => {
                const d1 = approve.data["1990"];
                const d2 = approve.data["1991"];
                const d3 = approve.data["1992"];
                const d4 = approve.data["1992"];
                const d5 = approve.data["1993"];
                const d6 = approve.data["1994"];
                const d7 = approve.data["1995"];
                const d8 = approve.data["1996"];
                const d9 = approve.data["1997"];
                const d10 = approve.data["1998"];
                const d11 = approve.data["1999"];
                const d12 = approve.data["2000"];
                const d13 = approve.data["2001"];
                const d14 = approve.data["2002"];
                const d15 = approve.data["2003"];
                const d16 = approve.data["2004"];
                const d17 = approve.data["2005"];
                const d18 = approve.data["2006"];
                const d19 = approve.data["2007"];
                const d20 = approve.data["2008"];
                const d21 = approve.data["2009"];
                const d22 = approve.data["2010"];
                const d23 = approve.data["2012"];
                const d24 = approve.data["2013"];
                const d25 = approve.data["2014"];
                const d26 = approve.data["2015"];
                const d27 = approve.data["2016"];
                const d28 = approve.data["2017"];
                const d29 = approve.data["2018"];
                const countryCode = approve.data["CountryCode"];
                const country = approve.data["Country"];
                const seriesCode = approve.data["SeriesCode"];
                let jsonArray = JSON.parse(file);
                jsonArray.push({
                    "1990": d1,
                    "1991": d2,
                    "1992": d3,
                    "1993": d4,
                    "1994": d5,
                    "1995": d6,
                    "1996": d7,
                    "1997": d8,
                    "1998": d9,
                    "1999": d10,
                    "2000": d11,
                    "2001": d12,
                    "2002": d13,
                    "2003": d14,
                    "2004": d15,
                    "2005": d16,
                    "2006": d17,
                    "2007": d18,
                    "2008": d19,
                    "2009": d20,
                    "2010": d21,
                    "2011": d22,
                    "2012": d23,
                    "2013": d24,
                    "2014": d25,
                    "2015": d26,
                    "2016": d27,
                    "2017": d28,
                    "2018": d29,
                    "CountryCode": countryCode,
                    "Country": country,
                    "SeriesCode": seriesCode,
                    "MDG": "Y",
                    "Series": "Carbon dioxide emissions (CO2), metric tons of CO2 per capita (CDIAC)",
                    "Footnotes": "",
                    "Type": ""
                });
                fs.writeFile(process.cwd() + "/raw_data/percap.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
                fs.readFile(process.cwd() + "/client/public/data/percap.json", (err, file) => {
                    let jarray = JSON.parse(file);
                    const data = {
                        "1990": d1,
                        "1991": d2,
                        "1992": d3,
                        "1993": d4,
                        "1994": d5,
                        "1995": d6,
                        "1996": d7,
                        "1997": d8,
                        "1998": d9,
                        "1999": d10,
                        "2000": d11,
                        "2001": d12,
                        "2002": d13,
                        "2003": d14,
                        "2004": d15,
                        "2005": d16,
                        "2006": d17,
                        "2007": d18,
                        "2008": d19,
                        "2009": d20,
                        "2010": d21,
                        "2011": d22,
                        "2012": d23,
                        "2013": d24,
                        "2014": d25,
                        "2015": d26,
                        "2016": d27,
                        "2017": d28,
                        "2018": d29
                    }
                    jarray[country] = data;
                    const newdata = {};
                    Object.keys(jarray)
                        .sort()
                        .forEach(function (v, i) {
                            newdata[v] = jarray[v];
                        })
                    fs.writeFile(process.cwd() + "/client/public/data/percap.json", JSON.stringify(newdata), (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("successfully appended to front-end data");
                        }
                    });
                });
            });
        } else if (approve.title === 'Poultry') {
            fs.readFile(process.cwd() + "/raw_data/poultry.json", (err, file) => {
                const type = approve.data["type"];
                const region = approve.data["region"];
                const pfem = approve.data["pf_emissions"];
                const pem = approve.data["p_emissions"];
                const wfactor = approve.data["wl_factor"];
                const mlfactor = approve.data["ml_factor"];
                let jsonArray = JSON.parse(file);
                jsonArray["data"].push({
                    "type": type,
                    "region": region,
                    "pf_emissions": pfem,
                    "p_emissions": pem,
                    "wl_factor": wfactor,
                    "ml_factor": mlfactor,
                    "unit": "kg"
                });
                fs.writeFile(process.cwd() + "/raw_data/poultry.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
            });
        } else if (approve.title === 'Trains') {
            fs.readFile(process.cwd() + "/raw_data/trains.json", (err, file) => {
                const trainType = approve.data["trainType"];
                const co2 = approve.data["CO2"];
                const no2 = approve.data["NO2"];
                const ch4 = approve.data["CH4"];
                const region = approve.data["region"];
                const quant = approve.data["quantity"];
                const mf = approve.data["MF"];
                let jsonArray = JSON.parse(file);
                jsonArray[trainType] = {
                    "C02": co2,
                    "NO2": no2,
                    "CH4": ch4,
                    "region": region,
                    "category": "transport",
                    "method": "simple",
                    "quantity": [quant],
                    "unit": "kg/km",
                    "M.F.(multiply factor)": mf
                };
                fs.writeFile(process.cwd() + "/raw_data/trains.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
            });
        } else if (approve.title === 'Trees') {
            fs.readFile(process.cwd() + "/raw_data/trees.json", (err, file) => {
                const treeName = "" + approve.data["treename"];
                const emission = approve.data["emission"]
                let jsonArray = JSON.parse(file);
                jsonArray["treeData"][treeName] = parseInt(emission);
                fs.writeFile(process.cwd() + "/raw_data/trees.json", JSON.stringify(jsonArray), (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("successfully approved");
                    }
                });
            });
        } else {
            console.error;
        }
    });
    suggestedData.findByIdAndRemove({ _id: req.body.data_id }, (err, approved) => {
        if (err) {
            res.send(400).json(err);
        } else {
            console.log("Removed from the verification list");
        }
    })
});

router.post('/rejectData', (req, res) => {
    suggestedData.findByIdAndRemove({ _id: req.body.data_id }, (err, reject) => {
        if (err) {
            res.send(400).json(err);
        } else {
            console.log(reject);
        }
    })
})

router.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.body);
    console.log(req.file);
})

module.exports = router;