/* eslint-disable array-callback-return */
// import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./api";
import querystring from "querystring";
import { parseHTMLValue, parseXMLValue } from "./utils";
import Papa from 'papaparse';
import Loader from "react-js-loader";

const App = () => {
  const [buttonClick, setButtonClick] = useState(false);
  const [allDataAPI, setAllDataAPI] = useState([]);
  const [mainLoader, setMainLoader] = useState(false);

  function matchAndCreateKeyValue(abcItem, prqItem) {
    const keyToMatch = abcItem.Supp_Col_Name;
    // Check if keyToMatch contains commas
    if (keyToMatch?.includes(',')) {
      const keys = keyToMatch?.split(',');
      const result = {};
      const displayKeyName = abcItem?.Display_Name;
      let matchedValue = '';
      keys?.forEach(key => {
        if (prqItem?.hasOwnProperty(key?.trim())) {
          matchedValue = `${matchedValue}${prqItem[key?.trim()] && `${prqItem[key?.trim()]},`}`
          // Append key-value pair to result with comma separator
        }
      });
      result[`${displayKeyName}`] = matchedValue;
      return result;
    } else {
      // If keyToMatch doesn't contain commas, proceed as before
      if (prqItem.hasOwnProperty(keyToMatch)) {
        const displayKeyName = abcItem?.Display_Name;
        if (abcItem?.Is_Sequence && abcItem?.Is_Split ) {
          const arraySeparatorData = prqItem[keyToMatch].split(abcItem?.Separator);
          const matchedValue = arraySeparatorData[abcItem?.Sequence - 1];
          return { [displayKeyName]: matchedValue };
        } else {
          const matchedValue = prqItem[keyToMatch];
          return { [displayKeyName]: matchedValue };
        }
      }
    }
    return null;
  }
  
  const callPostAPI = async (partyId, data, uploadType) => {
    return new Promise((resolve) => {
    const body = {
      Stock_Data_Id: 0,
      Supplier_Id: partyId,
      Upload_Method: uploadType ? uploadType : "API",
      Upload_Type: "O",
      Stock_Data_List: data,
    };

    // const form_data = new FormData();
    // form_data.append("Stock_Data_Id", 0);
    // form_data.append("Supplier_Id", partyId);
    // form_data.append("Upload_Method", "API");
    // form_data.append("Upload_Type", "0");

    // data?.forEach((value, index) => {
    //   Object.keys(value).forEach((key) => {
    //     form_data.append(`Stock_Data_List[${index}].${key}`, value[key]);
    //   });
    // });
    axios
      .post(
        `${API_BASE_URL}/party/create_update_supplier_stock_by_scheduler`,
        body
      )
      .then(() => {
          resolve();
          setMainLoader(false);
      })
      .catch(() => {
        console.log("error on catch");
        resolve();
        setMainLoader(false);
      });
    })
  };

  const callAPI = async (apiFormDataAll) => {
    setMainLoader(true);
    if (apiFormDataAll?.Upload_Type === 'API') {
    if (apiFormDataAll?.API_Method === "post") {
      if (apiFormDataAll?.API_Response === "json") {
        const userCaption = apiFormDataAll?.User_Caption;
        const userName = apiFormDataAll?.API_User;
        const passwordCaption = apiFormDataAll?.Password_Caption;
        const passwordValue = apiFormDataAll?.API_Password;
        const actionCaption = apiFormDataAll?.Action_Caption;
        const actionValue = apiFormDataAll?.Action_Value;
        const activeCaption_1 = apiFormDataAll?.Action_Caption_1;
        const activeValue_1 = apiFormDataAll?.Action_Value_1;
        const params = {
          [actionCaption]: actionValue,
          [userCaption]: userName,
          [passwordCaption]: passwordValue,
          [activeCaption_1]: activeValue_1,
        };
        const paramsJewel = {
          [actionCaption]: actionValue,
          [userCaption]: userName,
          [passwordCaption]: passwordValue,
          // [activeCaption_1]: activeValue_1
        };
        const formData = querystring.stringify(params);
        const formDataKbs = querystring.stringify(paramsJewel);
        const baseUrl = apiFormDataAll?.API_URL;

        if (apiFormDataAll?.User_Id) {
          return axios
            .post(baseUrl, formData, {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            })
            .then(async (response) => {
              const Action_Caption_1 = apiFormDataAll?.Action_Caption_1;
              const Action_Value_1 = apiFormDataAll?.Action_Value_1;
              const params = response?.data?.UserId
                ? {
                    UserId: response?.data?.UserId,
                    TokenId: response?.data?.TokenId,
                  }
                : {
                    [Action_Caption_1]: Action_Value_1,
                    token: response?.data?.msgdata?.token,
                  };
              const formData1 = querystring.stringify(params);
              const baseUrlShairu = apiFormDataAll?.Stock_Url;
              return axios
                .post(baseUrlShairu || baseUrl, formData1, {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                })

                .then((res) => {
                  const rowsArray = res?.data?.msgdata?.rows;
                  const dataArray = res?.data?.Data;
                  const arrayProper =
                    rowsArray?.length > 0 ? rowsArray : dataArray;
                  return new Promise(async (resolve) => {
                    const result = arrayProper.map((prqItem) =>
                      apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                        (acc, abcItem) => {
                          const matchedPair = matchAndCreateKeyValue(
                            abcItem,
                            prqItem
                          );
                          if (matchedPair !== null) {
                            acc = { ...acc, ...matchedPair };
                          }
                          return acc;
                        },
                        {}
                      )
                    );

                    await callPostAPI(apiFormDataAll?.Party_Id, result);
                    resolve();
                  });
                });
            })
            .catch((error) => {
              return new Promise(async (resolve) => {
                resolve();
              });
            });
        } else if (apiFormDataAll?.Action_Value === "viplogin") {
          //Jewel (Jp)
          return axios
            .post(baseUrl, paramsJewel, {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            })
            .then(async (response) => {
              const baseUrlShairu = apiFormDataAll?.API_URL;
              const params = {
                [activeCaption_1]: activeValue_1,
                token: response?.data?.msgdata?.token,
              };
              return axios
                .post(baseUrlShairu, params, {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                })
                .then((res) => {
                  const dataArray = res?.data?.msgdata?.rows;
                  return new Promise(async (resolve) => {
                    const result = dataArray?.map((prqItem) =>
                      apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                        (acc, abcItem) => {
                          const matchedPair = matchAndCreateKeyValue(
                            abcItem,
                            prqItem
                          );
                          if (matchedPair !== null) {
                            acc = { ...acc, ...matchedPair };
                          }
                          return acc;
                        },
                        {}
                      )
                    );
                   await callPostAPI(apiFormDataAll?.Party_Id, result);
                    resolve();
                  });
                });
            })
            .catch((error) => {
              return new Promise(async (resolve) => {
                resolve();
              });
            });
        } else if (apiFormDataAll?.Action_Caption === "grant_type") {
          //KBS
          return axios
            .post(baseUrl, formDataKbs, {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            })
            .then(async (response) => {
              const baseUrl = apiFormDataAll?.Stock_Url;
              return axios
                .get(baseUrl, {
                  headers: {
                    Authorization: `Bearer ${response?.data?.access_token}`,
                  },
                })
                .then((res) => {
                  const dataArray = res?.data;
                  return new Promise(async (resolve) => {
                    const result = dataArray?.map((prqItem) =>
                      apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                        (acc, abcItem) => {
                          const matchedPair = matchAndCreateKeyValue(
                            abcItem,
                            prqItem
                          );
                          if (matchedPair !== null) {
                            acc = { ...acc, ...matchedPair };
                          }
                          return acc;
                        },
                        {}
                      )
                    );
                    await callPostAPI(apiFormDataAll?.Party_Id, result);
                    resolve();
                  });
                });
            })
            .catch((error) => {
              return new Promise(async (resolve) => {
                resolve();
              });
            });
        } else {
          return axios
            .post(baseUrl, params)
            .then(async (response) => {
              const baseUrlShairu = apiFormDataAll?.Stock_Url;
              return axios
                .get(baseUrlShairu, {
                  headers: {
                    Authorization: `Bearer${response?.data?.data?.access_token}`,
                  },
                })
                .then((res) => {
                  const dataArray = res?.data?.data;
                  return new Promise(async (resolve) => {
                    const result = dataArray.map((prqItem) =>
                      apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                        (acc, abcItem) => {
                          const matchedPair = matchAndCreateKeyValue(
                            abcItem,
                            prqItem
                          );
                          if (matchedPair !== null) {
                            acc = { ...acc, ...matchedPair };
                          }
                          return acc;
                        },
                        {}
                      )
                    );
                    await callPostAPI(apiFormDataAll?.Party_Id, result);
                    resolve();
                  });
                });
            })
            .catch((error) => {
              return new Promise(async (resolve) => {
                resolve();
              });
            });
        }
      }
    } else if (apiFormDataAll?.Stock_Api_Method === "get") {
      const userCaption = apiFormDataAll?.User_Caption;
      const user = apiFormDataAll?.API_User;
      const passwordCaption = apiFormDataAll?.Password_Caption;
      const password = apiFormDataAll?.API_Password;
      const params = {
        [userCaption]: user,
        [passwordCaption]: password,
      };
      const baseUrl = apiFormDataAll?.Stock_Url;
      const url =
        params.null !== null
          ? `${baseUrl}?${new URLSearchParams(params)}`
          : baseUrl;

        const checkDomainName = (url, domainName) => {
          const urlDomain = new URL(url).hostname;
          return urlDomain === domainName;
        };

      return axios.get(url).then((res) => {
        if (apiFormDataAll?.Method_Type === "json") {
          const domainName = "www.livetrade9.com";
          const isMatching = checkDomainName(url, domainName);

          if (isMatching) { 
            const dataExcel = JSON.parse(res?.data);

            return new Promise(async (resolve) => {
              const result = dataExcel.map((prqItem) =>
                apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                  (acc, abcItem) => {
                    const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                    if (matchedPair !== null) {
                      acc = { ...acc, ...matchedPair };
                    }
                    return acc;
                  },
                  {}
                )
              );
              await callPostAPI(apiFormDataAll?.Party_Id, result);
              resolve();
            });
          } else {
          const data = res?.data?.rows;
          const keys = res?.data?.keys;
          const resultArray = [];

          // Iterate through the data arrays
          for (let i = 0; i < data?.length; i++) {
            const rowData = data[i];
            const entry = {};

            // Iterate through the keys array
            for (let j = 0; j < keys?.length; j++) {
              const key = keys[j];
              const value = rowData[j];
              entry[key] = value;
            }
            resultArray.push(entry);
          }

          const properArray = res?.data?.list
            ? res?.data?.list
            : res?.data?.IMAGE_URL
            ? resultArray
            : res?.data?.data
            ? res?.data?.data
            : res?.data?.Result
            ? res?.data?.Result
            : res?.data;

          return new Promise(async (resolve) => {
            const result = properArray.map((prqItem) =>
              apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                (acc, abcItem) => {
                  const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                  if (matchedPair !== null) {
                    acc = { ...acc, ...matchedPair };
                  }
                  return acc;
                },
                {}
              )
            );
            await callPostAPI(apiFormDataAll?.Party_Id, result);
            resolve();
          });
        }
        } else if (apiFormDataAll?.Method_Type === "html") {
          //Promising Start
          const rows = res?.data?.split("\n");
          const rows1 = rows.map((row) => row.split(","));
          const headers1 = rows1[0];
          const dataArray = rows1.slice(1).map((row) => {
            const obj = {};
            headers1?.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          //Promising End
          const rowDataValueRes = parseHTMLValue(res?.data);
          const rowDataValue =
            rowDataValueRes?.length > 0 ? rowDataValueRes : dataArray;

          return new Promise(async (resolve) => {
            const result = rowDataValue.map((prqItem) =>
              apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                (acc, abcItem) => {
                  const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                  if (matchedPair !== null) {
                    acc = { ...acc, ...matchedPair };
                  }
                  return acc;
                },
                {}
              )
            );
            await callPostAPI(apiFormDataAll?.Party_Id, result);
            resolve();
          });
        } else if (apiFormDataAll?.Method_Type === "header") {
          const rows = res?.data?.split("\n");
          // const rows1 = rows.map((row) => row.split(","));


          const rows1 = rows.map((row) => {
            const values = [];
            let insideQuotes = false;
            let currentValue = '';
          
            for (const char of row) {
              if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else if (char === '"') {
                insideQuotes = !insideQuotes;
              } else {
                currentValue += char;
              }
            }
          
            values.push(currentValue.trim());
            return values;
          });


          
          const headers1 = rows1[0];
          const dataArray = rows1.slice(1).map((row) => {
            const obj = {};
            headers1?.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          return new Promise(async (resolve) => {
            const result = dataArray.map((prqItem) =>
              apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                (acc, abcItem) => {
                  const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                  if (matchedPair !== null) {
                    acc = { ...acc, ...matchedPair };
                  }
                  return acc;
                },
                {}
              )
            );
            await callPostAPI(apiFormDataAll?.Party_Id, result);
            resolve();
          });
        } else if (apiFormDataAll?.Method_Type === "xml") {
          const rowDataValue = parseXMLValue(res?.data);
          return new Promise(async (resolve) => {
            const result = rowDataValue.map((prqItem) =>
              apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                (acc, abcItem) => {
                  const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                  if (matchedPair !== null) {
                    acc = { ...acc, ...matchedPair };
                  }
                  return acc;
                },
                {}
              )
            );
            await callPostAPI(apiFormDataAll?.Party_Id, result);
            resolve();
          });
        } else if (apiFormDataAll?.Method_Type === "text") {
          return new Promise(async (resolve) => {
            const result = res?.data.map((prqItem) =>
              apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                (acc, abcItem) => {
                  const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                  if (matchedPair !== null) {
                    acc = { ...acc, ...matchedPair };
                  }
                  return acc;
                },
                {}
              )
            );
            await callPostAPI(apiFormDataAll?.Party_Id, result);
            resolve();
          });
        } else {
          return new Promise(async (resolve) => {
            const result = res.data.map((prqItem) =>
              apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                (acc, abcItem) => {
                  const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
                  if (matchedPair !== null) {
                    acc = { ...acc, ...matchedPair };
                  }
                  return acc;
                },
                {}
              )
            );
            await callPostAPI(apiFormDataAll?.Party_Id, result);
            resolve();
          });
        }
      }
      
      )
      .catch((error) => {

        //API call for error, sent a error message to backend side.
        const partyId = apiFormDataAll?.Party_Id

        const body = {
          Stock_Data_Id: 0,
          Supplier_Id: partyId,
          Upload_Method: "API",
          Upload_Type: "O",
          Stock_Data_List: [],
          Error_Message: error?.response?.data?.message
        };
        axios.post(
            `${API_BASE_URL}/party/create_update_supplier_stock_by_scheduler`,
            body
        );

        return new Promise(async (resolve) => {
          resolve();
        });
      })
    } else if (apiFormDataAll?.Stock_Api_Method === "post") {
      const userCaption = apiFormDataAll?.User_Caption;
      const userValue = apiFormDataAll?.API_User;

      const passwordCaption = apiFormDataAll?.Password_Caption;
      const passwordValue = apiFormDataAll?.API_Password;

      const actionCaption = apiFormDataAll?.Action_Caption;
      const actionValue = apiFormDataAll?.Action_Value;

      const actionCaption_1 = apiFormDataAll?.Action_Caption_1;
      const actionValue_1 = apiFormDataAll?.Action_Value_1;

      const params = {
        [actionCaption]: actionValue,
      };
      //Dharam creation
      const body = {
        [userCaption]: userValue,
        [passwordCaption]: passwordValue,
        [actionCaption]: actionValue,
        [actionCaption_1]: actionValue_1,
        columns: "",
        finder: "",
        sort: "",
      };

      const baseUrl = apiFormDataAll?.Stock_Url;
      const url = `${baseUrl}?${new URLSearchParams(params)}`;
      if (apiFormDataAll?.Method_Type === "json") {
        if (
          !apiFormDataAll?.User_Caption === "uniqID" ||
          apiFormDataAll?.User_Caption === null
        ) {
          //Condition for dharam creation
          //Veni Diam Start
          return fetch(apiFormDataAll?.Stock_Url, {
            method: "POST",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              return new Promise(async (resolve) => {
                const result = data?.GetStockResult?.Data.map((prqItem) =>
                  apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                    (acc, abcItem) => {
                      const matchedPair = matchAndCreateKeyValue(
                        abcItem,
                        prqItem
                      );
                      if (matchedPair !== null) {
                        acc = { ...acc, ...matchedPair };
                      }
                      return acc;
                    },
                    {}
                  )
                );
                await callPostAPI(apiFormDataAll?.Party_Id, result);
                resolve();
              });
            })
            .catch((error) => {
              return new Promise(async (resolve) => {
                resolve();
              });
            });
          //Veni Diam End
        } else {
          // Dharam creation
          return axios
            .post(url, body)
            .then((res) => {
              return new Promise(async (resolve) => {
                const result = res?.data?.DataList.map((prqItem) =>
                  apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                    (acc, abcItem) => {
                      const matchedPair = matchAndCreateKeyValue(
                        abcItem,
                        prqItem
                      );
                      if (matchedPair !== null) {
                        acc = { ...acc, ...matchedPair };
                      }
                      return acc;
                    },
                    {}
                  )
                );
               await  callPostAPI(apiFormDataAll?.Party_Id, result);
                resolve();
              });
            })
            .catch((error) => {
              return new Promise(async (resolve) => {
                resolve();
              });
            });
        }
      } else if (apiFormDataAll?.Method_Type === "xml") {
        let soapEnvelope;
        soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
          <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
              <Stock_API xmlns="http://tempuri.org/">
              <${apiFormDataAll?.User_Caption}>${apiFormDataAll?.API_User}</${apiFormDataAll?.User_Caption}>
              <${apiFormDataAll?.Password_Caption}>${apiFormDataAll?.API_Password}</${apiFormDataAll?.Password_Caption}>
              </Stock_API>
            </soap:Body>
          </soap:Envelope>`;

        return axios
          .post(apiFormDataAll?.Stock_Url, soapEnvelope, {
            headers: {
              "Content-Type": "text/xml", // Set the content type to XML
            },
          })
          .then((res) => {
            const endIndex = res.data.indexOf("]");
            const result =
              endIndex !== -1 ? res.data.substring(0, endIndex + 1) : res.data;

            const abc = JSON.parse(result + "}]");
            if (abc[0]?.data) {
              return new Promise(async (resolve) => {
                const result = abc[0]?.data.map((prqItem) =>
                  apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                    (acc, abcItem) => {
                      const matchedPair = matchAndCreateKeyValue(
                        abcItem,
                        prqItem
                      );
                      if (matchedPair !== null) {
                        acc = { ...acc, ...matchedPair };
                      }
                      return acc;
                    },
                    {}
                  )
                );
                await callPostAPI(apiFormDataAll?.Party_Id, result);
                resolve();
              });
            }
          })
          .catch((error) => {
            return new Promise(async (resolve) => {
              resolve();
            });
          });
      } else {
        return fetch(apiFormDataAll?.Stock_Url, {
          method: "POST",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            return new Promise(async (resolve) => {
              const result = data?.GetStockResult?.Data.map((prqItem) =>
                apiFormDataAll.Supplier_Column_Mapping_List.reduce(
                  (acc, abcItem) => {
                    const matchedPair = matchAndCreateKeyValue(
                      abcItem,
                      prqItem
                    );
                    if (matchedPair !== null) {
                      acc = { ...acc, ...matchedPair };
                    }
                    return acc;
                  },
                  {}
                )
              );
              await callPostAPI(apiFormDataAll?.Party_Id, result);
              resolve();
            });
          })
          .catch((error) => {
            return new Promise(async (resolve) => {
              resolve();
            });
          });
      }
    } else {
      console.log("No any API method specify");
    }
  } else if (apiFormDataAll?.Upload_Type === 'FTP'){
    // ApiGet(`${Endpoint.GET_SPPLIER_FTP_FILE}?supp_Id=${suppliesData?.Party_Id}`)
    axios.get(`${API_BASE_URL}/party/get_supplier_ftp_file_scheduler?supp_Id=${apiFormDataAll?.Party_Id}`)
    .then(async (res) => {
        const response = await fetch(res.data.data.url);
        const csvText = await response.text();
        const fetchResults = Papa.parse(csvText, { header: true });
        
        return new Promise(async (resolve) => {
        const result = fetchResults?.data.map((prqItem) =>
        apiFormDataAll.Supplier_Column_Mapping_List.reduce(
          (acc, abcItem) => {
            const matchedPair = matchAndCreateKeyValue(abcItem, prqItem);
            if (matchedPair !== null) {
              acc = { ...acc, ...matchedPair };
            }
            return acc;
          },
          {}
        )
        );

        await callPostAPI(apiFormDataAll?.Party_Id, result, apiFormDataAll?.Upload_Type);
            resolve();
          });
    })  
  }
  };

  const fetchData = async () => {
    try {
      
      for (const data of allDataAPI || []) {
        await callAPI(data);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    axios.get(
      `${API_BASE_URL}/party/get_party_api_with_column_mapping`
    ).then((response) => {
      setAllDataAPI(response.data.data);
    })
  }, []);

  const fetchData2 = () => {
     axios.get(
      `${API_BASE_URL}/party/get_party_api_with_column_mapping`
    ).then(async (response) => {
      // setAllDataAPI(response.data.data);
      try {
        for (const data of response.data.data || []) {
          await callAPI(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    })
  }

  // Called useEffect every 2 h for schedular
  // useEffect(() => {
  //     fetchData2();
  //   const intervalId = setInterval(fetchData2, 2 * 60 * 60 * 1000);
  //   return () => clearInterval(intervalId);
  // }, []);

  return (
    <div className="App">
       {
        mainLoader && 
<div style={{
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  position: 'fixed', 
  backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  height: '100vh', 
  width: '100vw'
  }}>
    <Loader type="bubble-spin" bgColor={'blue'} size={100} />
    </div>}
      <table>
        <tr>
          <th>Company</th>
          <th>Upload</th>
        </tr>
        {
          allDataAPI?.map((data, index) => {
          return (
            <tr key={index}>
              <td>
                {data?.Short_Code}
              </td>
              {/* Click to single API call */}
              <td className="upload-td" onClick={() => callAPI(data)}>
                Upload
              </td>
            </tr>
          )})
        }
      </table>

      <header className="App-header">
        {/* Click to all Client API call */}
        <button style={{height: '50px', width: '300px', margin: '50px'}} onClick={() => fetchData()}>Upload All</button>
      </header>
    </div>
  );
};

export default App;
