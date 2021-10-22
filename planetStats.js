/*

temperature: 0K - 3500K
atmosphere: very low / low / medium / high / very high
gravity: very low / low / medium / high / very high
inhabitants:
    * none (20%)
    * microbes (20%)
    * algae (15%)
    * sea life (15%)
    * mammals (10%)
    * colonies of apes (10%)
    * human-like (5%)
    * advanced alien civilization (5%)

*/

// let pickInhabitants = () => {
//     let n = Math.random();
//     if(n < .20) {
//         return 'none';
//     } else if (n < .45) {
//         return 'microbes';
//     } else if (n < .60) {
//         return 'fish';
//     } else if (n < .70) {
//         return 'mammals';
//     } else if (n < .8) {
//         return 'colonies of apes';
//     } else if (n < .95) {
//         return 'human-like';
//     } else {
//         return 'advanced alien civilization';
//     }
// }

let pickInhabitants = () => {
    let n = Math.random ();
    
    if (n <= .9) {
        return 'none';
    } else {
        n = Math.random ();
        if (n <= .5) return 'micro-organisms';
        if (n <= .7) return 'aquatic creatures';
        if (n <= .8) return 'mammals';
        if (n <= .9) return 'colonies of apes';
        if (n <= .95) return 'human-like';
        return 'advanced alien civilization';

    }
}

function getStats() {
    return {
        temp: (Math.random() * 3500).toFixed(2),
        atmosphere: ['very low', 'low', 'medium', 'high', 'very high'][Math.floor(Math.random() * 5)],
        gravity: ['very low', 'low', 'medium', 'high', 'very high'][Math.floor(Math.random() * 5)],
        inhabitants: pickInhabitants()
    }
}
module.exports = {
    getStats: getStats
}