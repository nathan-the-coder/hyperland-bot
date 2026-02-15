const axios = require("axios");

async function getServerStatus() {
    try {
        const response = await axios.get(`https://api.mcsrvstat.us/2/ownage.gg`);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = { getServerStatus };
