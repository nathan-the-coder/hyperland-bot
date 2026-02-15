const axios = require("axios");

async function getServerStatus() {
    try {
        const response = await axios.get(`https://api.mcstatus.io/v2/status/java/${process.env.MC_IP}:${process.env.MC_PORT}`);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = { getServerStatus };
