import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/**  Global state of the app 
 * - Search object
 * - Current Recipe
 * - Shopping list object
 * - Liked Recipes
*/
const state = {};

/**
 *  Search Controller
 */
const controlSearch = async () => {
    // 1) Get the query from view
    const query = searchView.getInput();

    if(query){
        // 2) New search object and add it to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{    
             // 4) search for recipes
            await state.search.getResults();

            // 5) render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }catch(error){
            alert('Something went wrong with the search!');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchRes.addEventListener('click', e => {
    const button = e.target.closest('.btn-inline');

    if(button){
        const goToPage = parseInt(button.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});


/**
 *  Recipe Controller
 */

const controlRecipe = async () =>{
    //Get ID from url
    const id = window.location.hash.replace('#','');

    if(id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight Selected recipe
        if(state.search){
            searchView.highlightSelected(id);
        }

        //Create new recipe object
        state.recipe = new Recipe(id);

        try{
            //Get recipe data   
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            

            //Render recipes
            clearLoader();
            recipeView.renderRecipe(
                state.recipe, 
                state.likes.isLiked(id)
            );
        }catch(error){
            alert('Error processing recipe');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * List Controller
 */
const controlList = () =>{
    //Create a new list if there is not one
    if(!state.list) state.list = new List();


    //Add each ingredient to list and UI
    state.recipe.ingredients.forEach(el =>{
        const item = state.list.additem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Handle Delete and Update list item shopping events
elements.shopping.addEventListener('click', e =>{
    const id = e.target.closest('.shopping__item').dataset.itemid;
  
    //Handle delete event
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        //Delete from state 
        state.list.deleteitem(id);

        //Delete from UI
        listView.deleteItem(id);
    } else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/**
 *  Likes Controller
 */


const controlLike = () =>{
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has not yet liked the current recipe
    if(!state.likes.isLiked(currentID)){
        //Add like to the state
        const newLike = state.likes.addLikes(
            currentID,
            state.recipe.title, 
            state.recipe.author, 
            state.recipe.image
        );

        //toggle like button
        likesView.toggleLikeBtn(true);

        //Add like to UI
        likesView.renderLike(newLike);

        //User has liked the current recipe
    }else{
        //Remove like from state
        state.likes.deleteLike(currentID);

        //toggle like button
        likesView.toggleLikeBtn(false);

        //Remove like from UI
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore Likes
    state.likes.readStorage();

    //Toggle menu like button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //RENDER EXISTING LIKES
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e =>{
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //decrease button is clicked
        if(state.recipe.servings >1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIng(state.recipe);
        }
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIng(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //Add ingredients to shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        //Like Controller
        controlLike();
    }
});