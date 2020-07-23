import axios from 'axios';

export default class Recipe{
    constructor(id){
        this.id = id;
    }

    async getRecipe(){
        try{
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.image = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
        }catch(error){
            console.log(error);
            alert('Something went wrong :(');
        }
    }

    calcTime(){
        //Assuming we need 15 min for every 3 ingredients
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng/3);
        this.time =  periods * 15;
    }

    calcServings(){
        this.servings = 4;
    }

    parseIngredients(){
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound']; 
        const units = [... unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
             // 1. Uniform all units
            let ingredient = el.toLowerCase();

            unitsLong.forEach((unit, i) =>{
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

             //2. Remove Parenthesis
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');
        
             //3.Parse ingredients count and unit
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(elem => units.includes(elem))

            let objIng;
            if(unitIndex > -1){
                // there is a unit

                // example: 1 1/2 cup  arrCount = [1 , 1/2] ==> eval('1+1/2')
                // example: 1 cup  arrCount = [1]
                const arrCount = arrIng.slice(0, unitIndex);  
                let count;
                if(arrCount === 1){
                    count = eval(arrIng[0].replace('-', '+'));
                }else {
                    count = eval(arrIng.slice(0, unitIndex).join('+'));
                }

                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex+1).join(' ')
                };

            }else if (parseInt(arrIng[0], 10)){
                // there is no unit but 1st element is number
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit : '',
                    ingredient : arrIng.slice(1).join(' ')
                };

            }else if(unitIndex === -1){
                //there is NO unit and no number at 1st position
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient
                };
            }

            return objIng;
        });

        this.ingredients = newIngredients;
    }

    updateServings(type){
        //Servings
        const newServings = type === 'dec'? this.servings-1 : this.servings+1;

        //Ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    }

}
