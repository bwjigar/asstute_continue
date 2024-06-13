export const parseXMLValue = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  const data = [];

  // Select all <Row> elements in the XML document
  const rowElements = xmlDoc.querySelectorAll("Row");

  // Iterate over each <Row> element
  rowElements.forEach((rowElement) => {
    const rowData = {};
    const { children } = rowElement;

    // Iterate over the child elements of <Row>
    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const key = element.tagName;
      const value = element.textContent.trim();
      rowData[key] = value;
    }

    data.push(rowData);
  });

  return data;
};

export const parseHTMLValue = (htmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(htmlString, "text/html");
  const data = [];

  // Select all <ExcelData> elements in the HTML document
  const excelDataElements = xmlDoc.querySelectorAll("ExcelData");
  // Iterate over each <ExcelData> element
  excelDataElements.forEach((excelDataElement) => {
    const excelData = {};
    const { children } = excelDataElement;

    // Iterate over the child elements of <ExcelData>
    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const key = element.tagName;
      const value = element.textContent.trim();
      excelData[key] = value;
    }

    data.push(excelData);
  });

  return data;
};
