import { scrape750g } from './750gScraper';

// Test HTML snippet from the 750g page
const testHtml = `
<script type="application/ld+json">
{
    "@context": "http://schema.org/",
    "@type": "Recipe",
    "name": "Salade de pamplemousse, avocat et crevettes",
    "url": "https://www.750g.com/salade-de-pamplemousse-avocat-et-crevettes-r84841.htm",
    "image" : {
        "@context": "http://schema.org",
        "@type": "ImageObject",
        "url": "https://static.750g.com/images/1200-675/da4751db5eb18d9a423b195b65b391ff/salade-de-pamplemousse-avocat-et-crevettes.jpeg"
    },
    "author": {
        "@context": "http://schema.org",
        "@type": "Person",
        "name": "La cuillère aux mille délices"
    },
    "datePublished": "2015-07-23",
    "description": "Cette recette de salade est fraîche et vitaminée. Elle est riche en saveurs et son dressage est original. Vous allez adorer cette recette en entrée ou pour un plat léger.",
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "3.9",
        "ratingCount": "48",
        "bestRating": 5,
        "worstRating": 1
    },
    "keywords" : "salade d&#039;avocat et pamplemousse,salade de pamplemousse,salade aux avocat et crevettes,salade de crevettes,salade d&#039;avocat,crevettes,avocat,entrées,entrées froides,Concours &quot;Cuisinez léger&quot;,750green",
    "prepTime": "PT15M",
    "totalTime": "PT15M",
    "recipeYield": "2 personnes",
    "recipeCategory" : "Salade",
    "recipeIngredient": ["10 crevettes roses","1 pamplemousse","1 avocat","Huile d'olive","Feuille de laitue","Sel ou sel fin","Poivre"],
    "recipeInstructions": [{
        "@type": "HowToStep",
        "text": "Couper le pamplemousse en deux et prélever les quartiers de celui-ci. Réserver le jus. Couper l'avocat en deux, enlever le noyau et le couper en dés.",
        "url": "https://www.750g.com/salade-de-pamplemousse-avocat-et-crevettes-r84841.htm#recipe-step1"
    },{
        "@type": "HowToStep",
        "text": "Dans une moitié de pamplemousse, mettre dans le fond quelques feuilles de laitue, ajouter les quartiers de pamplemousse, les dés d'avocat et disposer les crevettes.",
        "url": "https://www.750g.com/salade-de-pamplemousse-avocat-et-crevettes-r84841.htm#recipe-step2"
    },{
        "@type": "HowToStep",
        "text": "Verser sur le dessus un filet d'huile d'olive, et le jus de pamplemousse. Saler et poivrer.",
        "url": "https://www.750g.com/salade-de-pamplemousse-avocat-et-crevettes-r84841.htm#recipe-step3"
    }]
}
</script>
`;

const url = "https://www.750g.com/salade-de-pamplemousse-avocat-et-crevettes-r84841.htm";

try {
  const result = scrape750g(url, testHtml);
  console.log("✓ Scraper successful!");
  console.log("Recipe:", result);
} catch (error) {
  console.error("✗ Scraper failed:", error);
}
