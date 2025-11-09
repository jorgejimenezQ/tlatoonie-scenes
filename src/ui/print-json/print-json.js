export const printJSON = (obj) => {
    console.log(JSON.stringify(obj, null, 2));
};

export const printJSONToFile = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
};
