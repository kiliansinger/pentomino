//https://medium.com/@techsuneel99/speed-up-javascript-array-processing-1f878158f4f1
//https://ecostack.dev/posts/wasm-tinygo-vs-rust-vs-assemblyscript/
//https://www.c-sharpcorner.com/article/arraybuffer-vs-typed-array-in-javascript-understanding-the-differences-and-usag/
function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
function update(){
    navigator.serviceWorker.getRegistration().then(function(reg) {
    if (reg) {
      reg.unregister().then(function() { window.location.reload(true); });
    } else {
       window.location.reload(true);
    }
  });
}

document.getElementById("start").onclick = start;
document.getElementById("solve").onclick = solve;
document.getElementById("update").onclick = update;

class Item {
    constructor(name, llink, rlink) {
        this.name = name;
        this.llink = llink;
        this.rlink = rlink;
    }
}

class Option {
    constructor(top, ulink, dlink) {
        this.top = top;
        this.ulink = ulink;
        this.dlink = dlink;
    }
}
let this_items_llink;
let this_items_rlink;
let this_items_name;
let this_options_top;
let this_options_ulink;
let this_options_dlink;

class DancingLinks {
    constructor() {
        this.optionArrays = [];
        this.items = [new Item("", 0, 0)]
        this.secondaryitems = [];
        this.itemMap = new Map();
        this.options = [new Option(0, 0, 0), new Option(0, 0, 0)];
        this.currentoptionstart = 0;
        this.spacercnt = 0;
        this.forcecnt = 0;
        this.lastprimaryitemnum=0;
    }
    pushItem(itemName,primary=true) {
        if (this.itemMap.has(itemName)) {
            console.error("Item already exists");
            return false;
        }
        this.itemMap.set(itemName, { "cnt": 0, "index": this.items.length,"primary":primary });
        let item = new Item(itemName, this.lastprimaryitemnum, 0);
        if(primary){
            this.items[this.lastprimaryitemnum].rlink = this.items.length;
            this.items[0].llink = this.items.length;
            this.lastprimaryitemnum=this.items.length;
        }
        else{
            item.llink=this.items.length;
            item.rlink=this.items.length;
        }
        this.items.push(item);
        let option = this.options[this.options.length - 1];
        option.top = 0;
        option.ulink = this.options.length - 1;
        option.dlink = this.options.length - 1;
        this.options.push(new Option(0, 0, 0));
        return true;
    }
    _modSpacer(optionarraylength) {
        let option = this.options[this.options.length - 1];
        this.currentoptionstart = this.options.length;
        option.dlink = this.currentoptionstart + optionarraylength - 1;
    }
    _addSpacer() {
        this.spacercnt--;
        this.options.push(new Option(this.spacercnt, this.currentoptionstart, 0));
    }
    _addNode(itemnum) {
        let lastopt = this.options[this.options[itemnum].ulink];
        this.options.push(new Option(itemnum, this.options[itemnum].ulink, itemnum));//add node into circular linked list
        lastopt.dlink = this.options.length - 1;
        this.options[itemnum].ulink = this.options.length - 1;
    }
    _cover(itemnum) {
        let p = this.options[itemnum].dlink;
        while (p !== itemnum) {
            this._hide(p);
            p = this.options[p].dlink;
        }
        let l = this.items[itemnum].llink;
        let r = this.items[itemnum].rlink;
        this.items[l].rlink = r;
        this.items[r].llink = l;
    }
    __cover(itemnum) {
        let p = this_options_dlink[itemnum];
        while (p !== itemnum) {
            this.__hide(p);
            p = this_options_dlink[p];
        }
        let l = this_items_llink[itemnum];
        let r = this_items_rlink[itemnum];
        this_items_rlink[l]= r;
        this_items_llink[r] = l;
    }
    _reorderItemsAfterDec(i) {//for sudoku this gives typically a factor of 2 speedup
        // but also slows e.g. pentomino down by factor of 2 due to the sorting
        return;
        if(this.items[i].llink===0) return;
        let j=this.items[i].llink;
        if(this.options[i].top>=this.options[j].top) return;
        while(true){
            if(this.options[i].top<this.options[j].top && j!==0){
                j=this.items[j].llink;
            }else{
                this._swap(i,this.items[j].rlink,this.items.length);
                break;
            }
        }
          // for(let j=this.items[0].rlink;this.items[j].rlink!==0;j=this.items[j].rlink) if(this.items[j].top>this.items[this.items[j].rlink].top) console.error("!!!"+j); 
    }
    __reorderItemsAfterDec(i) {//for sudoku this gives typically a factor of 2 speedup
        // but also slows e.g. pentomino down by factor of 2 due to the sorting
        return;
        if(this_items_llink[i]===0) return;
        let j=this_items_llink[i];
        if(this_options_top[i]>=this_options_top[j]) return;
        while(true){
            if(this_options_top[i]<this_options_top[j] && j!==0){
                j=this_items_llink[j];
            }else{
                this.__swap(i,this_items_rlink[j],this_items_rlink.length);
                break;
            }
        }
          // for(let j=this.items[0].rlink;this.items[j].rlink!==0;j=this.items[j].rlink) if(this.items[j].top>this.items[this.items[j].rlink].top) console.error("!!!"+j); 
    }
    _reorderItemsAfterInc(i) {//for sudoku this gives typically a factor of 2 less steps
    // but also slows e.g. pentomino down by factor of 2 due to the sorting
        return;
        if(this.items[i].llink===0) return;
        let j=this.items[i].rlink;
        if(this.options[i].top<=this.options[j].top) return;
        while(true){
            if(this.options[i].top>this.options[j].top && j!==0){
                j=this.items[j].rlink;
            }else{
                this._swap(i,this.items[j].llink,this.items.length);
                break;
            }
        }
        // for(let j=this.items[0].rlink;this.items[j].rlink!==0;j=this.items[j].rlink) if(this.items[j].top>this.items[this.items[j].rlink].top) console.error("!!!"+j); 
    }
    __reorderItemsAfterInc(i) {//for sudoku this gives typically a factor of 2 less steps
    // but also slows e.g. pentomino down by factor of 2 due to the sorting
        return;
        if(this_items_llink[i]===0) return;
        let j=this_items_rlink[i];
        if(this_options_top[i]<=this_options_top[j]) return;
        while(true){
            if(this_options_top[i]>this_options_top[j] && j!==0){
                j=this_items_rlink[j];
            }else{
                this._swap(i,this_items_llink[j],this_items_llink.length);
                break;
            }
        }
        // for(let j=this.items[0].rlink;this.items[j].rlink!==0;j=this.items[j].rlink) if(this.items[j].top>this.items[this.items[j].rlink].top) console.error("!!!"+j); 
    }
    _hide(optionnum) {
        let q = optionnum + 1;
        while (q !== optionnum) {
            let x = this.options[q].top;
            let u = this.options[q].ulink;
            let d = this.options[q].dlink;
            if (x <= 0) {//q was a spacer
                q = u;
            } else {
                this.options[u].dlink = d;
                this.options[d].ulink = u;
                this.options[x].top--;//decrement length of column
                this._reorderItemsAfterDec(x);
                q++;
            }
        }
    }
    __hide(optionnum) {
        let q = optionnum + 1;
        while (q !== optionnum) {
            let x = this_options_top[q];
            let u = this_options_ulink[q];
            let d = this_options_dlink[q];
            if (x <= 0) {//q was a spacer
                q = u;
            } else {
                this_options_dlink[u] = d;
                this_options_ulink[d] = u;
                this_options_top[x]--;//decrement length of column
                this.__reorderItemsAfterDec(x);
                q++;
            }
        }
    }
    _uncover(itemnum) {
        let l = this.items[itemnum].llink;
        let r = this.items[l].rlink;//this needs to be done instead of this.items[itemnum].rlink because we might have swapped items
        this.items[l].rlink = itemnum;
        this.items[r].llink = itemnum;
        this.items[itemnum].rlink=r;
        let p = this.options[itemnum].ulink;
        while (p !== itemnum) {
            this._unhide(p);
            p = this.options[p].ulink;
        }
    }
    __uncover(itemnum) {
        let l = this_items_llink[itemnum];
        let r = this_items_rlink[l];//this needs to be done instead of this.items[itemnum].rlink because we might have swapped items
        this_items_rlink[l] = itemnum;
        this_items_llink[r] = itemnum;
        this_items_rlink[itemnum]=r;
        let p = this_options_ulink[itemnum];
        while (p !== itemnum) {
            this.__unhide(p);
            p = this_options_ulink[p];
        }
    }
    _unhide(optionnum) {
        let q = optionnum - 1;
        while (q !== optionnum) {
            let x = this.options[q].top;
            let u = this.options[q].ulink;
            let d = this.options[q].dlink;
            if (x <= 0) {//q was a spacer
                q = d;
            } else {
                this.options[u].dlink = q;
                this.options[d].ulink = q;
                this.options[x].top++;//increment length of column
                this._reorderItemsAfterInc(x);
                q--;
            }
        }
    }
    __unhide(optionnum) {
        let q = optionnum - 1;
        while (q !== optionnum) {
            let x = this_options_top[q];
            let u = this_options_ulink[q];
            let d = this_options_dlink[q];
            if (x <= 0) {//q was a spacer
                q = d;
            } else {
                this_options_dlink[u] = q;
                this_options_ulink[d] = q;
                this_options_top[x]++;//increment length of column
                this.__reorderItemsAfterInc(x);
                q--;
            }
        }
    }
    _swap(i,j,len){
        if(i===j) return;
        let il=this.items[i].llink;
        let ir=this.items[i].rlink;
        let jl=this.items[j].llink;
        let jr=this.items[j].rlink
        if(ir==j){
            this.items[il].rlink=j;
            this.items[j].llink=il;
            this.items[j].rlink=i;
            this.items[i].llink=j; 
            this.items[i].rlink=jr; 
            this.items[jr].llink=i;
        }else if(il==j){
            this.items[jl].rlink=i;
            this.items[i].llink=jl;
            this.items[i].rlink=j;
            this.items[j].llink=i;
            this.items[j].rlink=ir;
            this.items[ir].llink=j;
        }else{
            this.items[il].rlink=j;
            this.items[j].llink=il;
            this.items[j].rlink=ir;
            this.items[ir].llink=j;

            this.items[jl].rlink=i;
            this.items[i].llink=jl;
            this.items[i].rlink=jr;
            this.items[jr].llink=i;
        }
    }
    __swap(i,j,len){
        if(i===j) return;
        let il=this_items_llink[i];
        let ir=this_items_rlink[i];
        let jl=this_items_llink[j];
        let jr=this_items_rlink[j];
        if(ir==j){
            this_items_rlink[il]=j;
            this_items_llink[j]=il;
            this_items_rlink[j]=i;
            this_items_llink[i]=j; 
            this_items_rlink[i]=jr; 
            this_items_llink[jr]=i;
        }else if(il==j){
            this_items_rlink[jl]=i;
            this_items_llink[i]=jl;
            this_items_rlink[i]=j;
            this_items_llink[j]=i;
            this_items_rlink[j]=ir;
            this_items_llink[ir]=j;
        }else{
            this_items_rlink[il]=j;
            this_items_llink[j]=il;
            this_items_rlink[j]=ir;
            this_items_llink[ir]=j;

            this_items_rlink[jl]=i;
            this_items_llink[i]=jl;
            this_items_rlink[i]=jr;
            this_items_llink[jr]=i;
        }
    }
    _minimalRemainingOptionsHeuristic() {
        //choose item with minimal length
        //if multiple items have the same length, choose the first one
        let min = Number.MAX_SAFE_INTEGER;
        let minitem = 0;
        let p = this.items[0].rlink;
        while (p !== 0) {
            if (this.options[p].top < min) {
                min = this.options[p].top;
                minitem = p;
            }
            p = this.items[p].rlink;
        }
        return minitem;
    }
    _printSolution(x, l) {
        let solution = [];
        for (let i = 0; i <= l; i++) {
            let s1 = "";
            let s2 =""
            let j=x[i];
            let dos2=true;
            do{
                if(dos2) s2 += this.items[this.options[j].top].name;
                else s1 += this.items[this.options[j].top].name;
                ++j;
                if(this.options[j].top<0){
                    j=this.options[j].ulink;
                    dos2=false;
                }
            }while(j!=x[i]);
            solution.push(s1+s2);
        }
        return solution;
    }
    __printSolution(x, l) {
        let solution = [];
        for (let i = 0; i <= l; i++) {
            let s1 = "";
            let s2 =""
            let j=x[i];
            let dos2=true;
            do{
                if(dos2) s2 += this_items_name[this_options_top[j]];
                else s1 += this_items_name[this_options_top[j]];
                ++j;
                if(this_options_top[j]<0){
                    j=this_options_ulink[j];
                    dos2=false;
                }
            }while(j!=x[i]);
            solution.push(s1+s2);
        }
        return solution;
    }
    _scrambleItems() {
        for(let i=0;i<this.items.length;i++){
            this._swap(i,Math.floor(Math.random()*this.items.length),this.items.length);
        }
    }
    debugsetup() {//algorithm X: D. Knuth The Art of Computer Programming, Vol 4b, p69, Addison-Wesley, 2011
        this.finalizeOptions();
    }
    solve() {//algorithm X: D. Knuth The Art of Computer Programming, Vol 4b, p69, Addison-Wesley, 2011
        this.finalizeOptions();
        let iter=0;
       // this._scrambleItems(); //check if order is not important
        let x = new Array(this.items.length).fill(0),sol = [];
        for (let l = 0, lmin=0, dir = 1, i, j, p;
            l >= lmin;
            ((dir > 0) && (l < this.forcecnt)) && ++lmin,//short circuit increment needed for forced options
            l += dir
        ) {              
            iter++;                           //X1: initialize	
            if (dir > 0) {                          //X2: enter level l
                if (this.items[0].rlink === 0) {
                    sol.push(this._printSolution(x, l - 1));
                    dir = -1;
                    continue;//X8,X6
                }
                i = this.items[0].rlink; //this works if we do not shuffle or reorder
                
                this._cover(i);                     //x4: cover item
                x[l] = this.options[i].dlink;
            } else {                                //dir<0 then X6: Try again
                p = x[l] - 1;
                while (p !== x[l]) {
                    j = this.options[p].top;
                    if (j <= 0) p = this.options[p].dlink; //p is a spacer
                    else {
                        this._uncover(j);
                        p--;
                    }
                }
                i = this.options[x[l]].top;
                x[l] = this.options[x[l]].dlink;
            }
            if (x[l] === i) {                       //x5: try x[l]
                this._uncover(i);                   //x7: backtrack
                dir = -1;
                continue;
            } else {                                //x5...
                p = x[l] + 1;
                while (p !== x[l]) {
                    j = this.options[p].top;
                    if (j <= 0) p = this.options[p].ulink;//p is a spacer
                    else {
                        this._cover(j);
                        p++;
                    }
                }
                dir = 1;
                continue;
            }
        }
        console.log("iter:"+iter);
        return sol;
    }
    __solve() {//algorithm X: D. Knuth The Art of Computer Programming, Vol 4b, p69, Addison-Wesley, 2011
        this.finalizeOptions();
        this.copyToTypedArray();
        let iter=0;
       // this._scrambleItems(); //check if order is not important
        let x = new Int32Array(this_items_llink.length).fill(0)
        let sol = [];
        for (let l = 0, lmin=0, dir = 1, i, j, p;
            l >= lmin;
            ((dir > 0) && (l < this.forcecnt)) && ++lmin,//short circuit increment needed for forced options
            l += dir
        ) {              
            iter++;                           //X1: initialize	
            if (dir > 0) {                          //X2: enter level l
                if (this_items_rlink[0] === 0) {
                    sol.push(this.__printSolution(x, l - 1));
                    dir = -1;
                    continue;//X8,X6
                }
                i = this_items_rlink[0]; //this works if we do not shuffle or reorder
                
                this.__cover(i);                     //x4: cover item
                x[l] = this_options_dlink[i];
            } else {                                //dir<0 then X6: Try again
                p = x[l] - 1;
                while (p !== x[l]) {
                    j = this_options_top[p];
                    if (j <= 0) p = this_options_dlink[p]; //p is a spacer
                    else {
                        this.__uncover(j);
                        p--;
                    }
                }
                i = this_options_top[x[l]];
                x[l] = this_options_dlink[x[l]];
            }
            if (x[l] === i) {                       //x5: try x[l]
                this.__uncover(i);                   //x7: backtrack
                dir = -1;
                continue;
            } else {                                //x5...
                p = x[l] + 1;
                while (p !== x[l]) {
                    j = this_options_top[p];
                    if (j <= 0) p = this_options_ulink[p];//p is a spacer
                    else {
                        this.__cover(j);
                        p++;
                    }
                }
                dir = 1;
                continue;
            }
        }
        console.log("iter:"+iter);
        return sol;
    }
    arraysAreEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
            return false;
            }
        }
        
        return true;
    }
    setOption(optionArray, force = false) {
        optionArray.sort();
        var obj=this;
        var isDuplicate = this.optionArrays.reduce(function (accumulator, el) {
            //console.log(el, optionArray)
            return accumulator ||  obj.arraysAreEqual(el, optionArray);
          }, false);
        
        if (isDuplicate) {
          //  console.error("Option already exists");
            return false;
        }
        optionArray.forEach((option) => {
            if (!this.itemMap.has(option)) {
                console.error("Item " + option + " does not exist!");
                return false;
            }
            if (force) {
                if (this.itemMap.get(option).cnt < 0) {
                    console.error("Item " + option + " is already forced!");
                    return false;
                }
            }
        });
        optionArray.forEach((option) => {
            if (force) this.itemMap.get(option).cnt--;
            else if (this.itemMap.get(option).cnt >= 0) this.itemMap.get(option).cnt++;
        });
        if (force) this.optionArrays.unshift(optionArray.slice());  //put it at the beginning
        else this.optionArrays.push(optionArray.slice())
        if (force) this.forcecnt++;
    }
    
    finalizeOptions() {
        this.optimizeTable();
        this.optionArrays.forEach((optionArray) => {
            this._modSpacer(optionArray.length);
            optionArray.forEach((option) => {
                let itemnum=this.itemMap.get(option).index;
                this._addNode(itemnum);
                this.options[itemnum].top++;
            });
            this._addSpacer();
        });
        return true;
    }
    copyToTypedArray(){
        this_items_llink = new Int32Array(this.items.map(item => item.llink));
        this_items_rlink = new Int32Array(this.items.map(item => item.rlink));
        this_items_name = this.items.map(item => item.name);
        this_options_top = new Int32Array(this.options.map(option => option.top));
        this_options_ulink = new Int32Array(this.options.map(option => option.ulink));
        this_options_dlink = new Int32Array(this.options.map(option => option.dlink));
    }
    optimizeTable() {
        this.spacercnt = 0;
        this.currentoptionstart = 0;
        //sort items by cnt
        let arr = [...this.itemMap.entries()].sort((a, b) => a[1].cnt - b[1].cnt)
        this.itemMap = new Map(arr.map((obj, index) => [obj[0], { "cnt": obj[1].cnt, "index": index + 1 ,"primary":obj[1].primary}]));
        //
        this.options = this.options.slice(0, this.items.length + 1);
        let lastprimary=0;
        this.itemMap.forEach((value, key) => {
            this.items[value.index].name = key;
            if(value.primary){
                this.items[value.index].llink = lastprimary;
                this.items[value.index].rlink = 0;
                this.items[0].llink = value.index;
                this.items[lastprimary].rlink = value.index;
                lastprimary=value.index;
            }else{
                this.items[value.index].llink = value.index;
                this.items[value.index].rlink = value.index;
            }
            this.options[value.index].top = Math.abs(value.cnt);
            this.options[value.index].ulink = value.index;
            this.options[value.index].dlink = value.index;
        });
    }
};

///////////////////////////////////////////////
// UI
//////////////////////////////////////////////



let canvas=document.getElementById("canvas");
let ctx=canvas.getContext("2d");
let drawing=false;
let button;
let black=true;

document.getElementById("black").onclick = function(){black=true};
document.getElementById("white").onclick = function(){black=false};

(async ()=>{
    document.getElementById("info").innerHTML = "";
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,canvas.width*0.5,canvas.height*0.8);
})();
let num=10;
let blocksize=Math.floor(canvas.width/num);
let field=Array.from(Array(num), () => new Array(num));

function populateField(){
    for(let x=0;x<num;x++){
        for(let y=0;y<num;y++){
            field[y][x]=(ctx.getImageData(x*blocksize+blocksize/2, y*blocksize+blocksize/2, 1, 1).data[0]!=255 && ctx.getImageData(x*blocksize+blocksize/2, y*blocksize+blocksize/2, 1, 1).data[1]!=255 && ctx.getImageData(x*blocksize+blocksize/2, y*blocksize+blocksize/2, 1, 1).data[2]!=255)?0:1;
        }
    }
    console.log(field)
}

function start() {
    populateField();
    ss = new PentominoSolver(parts);
    ss.dl.debugsetup()
}


function mousedown(e){
    e.preventDefault();
    var b = canvas.getBoundingClientRect();
    var scale = canvas.width / parseFloat(b.width);
    var x = Math.floor(((e.clientX - b.left) * scale)/blocksize)*blocksize;
    var y = Math.floor(((e.clientY - b.top) * scale)/blocksize)*blocksize;
    drawing=true;
    if(button==-1) return;
    button=e.button;
    if(button===undefined){
         button=-1;
         x = Math.floor(((e.touches[0].clientX - b.left) * scale)/blocksize)*blocksize;
         y = Math.floor(((e.touches[0].clientY - b.top) * scale)/blocksize)*blocksize;
         if(black) ctx.fillStyle = "black"; 
         else ctx.fillStyle = "white"; 
    }
    if(button==0) ctx.fillStyle = "black";
    else if(button==2) ctx.fillStyle = "white";
    
    ctx.fillRect(x,y,blocksize,blocksize);
}

canvas.addEventListener("mousedown",mousedown);
canvas.addEventListener("touchstart",mousedown);

function mouseup(e){
        e.preventDefault();//this is needed for touch to avoid ghost mouse events
        drawing=false

}

canvas.addEventListener("mouseup",mouseup);
canvas.addEventListener("touchend",mouseup);
canvas.addEventListener("touchcancel",mouseup);

function mousemove(e){
    if(drawing){
        var b = canvas.getBoundingClientRect();
        var scale = canvas.width / parseFloat(b.width);
        var x = Math.floor(((e.clientX - b.left) * scale)/blocksize)*blocksize;
        var y = Math.floor(((e.clientY - b.top) * scale)/blocksize)*blocksize;
        if(button==-1){
            x = Math.floor(((e.touches[0].clientX - b.left) * scale)/blocksize)*blocksize;
            y = Math.floor(((e.touches[0].clientY - b.top) * scale)/blocksize)*blocksize;
            if(black) ctx.fillStyle = "black"; 
            else ctx.fillStyle = "white"; 
        }
        else if(button==0) ctx.fillStyle = "black";
        else if(button==2) ctx.fillStyle = "white";
        
        ctx.fillRect(x,y,blocksize,blocksize);
    }
}

canvas.addEventListener("mousemove",mousemove);
canvas.addEventListener("touchmove",mousemove);

let parts=[
    [//O
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0]
    ],
    [//P
        [1,1,0,0,0],
        [1,1,0,0,0],
        [1,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//Q
        [1,1,0,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [0,0,0,0,0]
    ],
    [//R
        [0,1,1,0,0],
        [1,1,0,0,0],
        [0,1,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]  
    ],
    [//S
        [0,0,1,1,0],
        [1,1,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//T
        [1,1,1,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//U
        [1,0,1,0,0],
        [1,1,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//V
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//W
        [1,0,0,0,0],
        [1,1,0,0,0],
        [0,1,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//X
        [0,1,0,0,0],
        [1,1,1,0,0],
        [0,1,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//Y
        [1,0,0,0,0],
        [1,1,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//Z
        [1,1,0,0,0],
        [0,1,0,0,0],
        [0,1,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ]/*,
    [//test
        [0,0,0,0,0],
        [0,0,1,1,0],
        [0,0,1,1,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [//test mirror
        [0,0,0,0,0],
        [0,1,1,0,0],
        [0,1,1,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ]*/
];
//error currently in 6x10 does do 246175330 iterations and finds nothing takes forever

let parts2=[
    [//O
        [1,0],
        [1,0]
    ],
    [//O
        [1,0],
        [0,0]
    ]
];
 //using typed Arrays gives a speedup from 1.1 to 0.9 seconds for 5x8 pentomino
 //for 5x10 speedup from 26 to 18 seconds
class PentominoSolver {
    constructor(parts) {
        this.parts=parts;
        this.xmin=new Array(this.parts.length).fill(0);
        this.xmax=new Array(this.parts.length).fill(0);
        this.ymin=new Array(this.parts.length).fill(0);
        this.ymax=new Array(this.parts.length).fill(0);
        this.setOffsetsSizes();
        this.dl = new DancingLinks();
        this.generateItems();
        this.generateOptions();
        this.inputField(field);
    }
    rotateBounds(rot,n){
        let siz=this.parts[0].length-1;
        switch(rot){
            //original
            case 0: return [this.xmin[n],this.xmax[n],this.ymin[n],this.ymax[n]];
            //rotated mathematically left once
            //              2               3         siz-    1        siz-      0
            case 1: return [this.ymin[n],this.ymax[n],siz-this.xmax[n],siz-this.xmin[n]];
            //rotated mathematically left twice
            case 2: return [siz-this.xmax[n],siz-this.xmin[n],siz-this.ymax[n],siz-this.ymin[n]];
            //rotated mathematically left three times
            case 3: return [siz-this.ymax[n],siz-this.ymin[n],this.xmin[n],this.xmax[n]];
            //now mirrored horizontally
            case 4: return [siz-this.xmax[n],siz-this.xmin[n],this.ymin[n],this.ymax[n]];
            //now mirrored horizontally and rotated mathematically left once
            case 5: return [this.ymin[n],this.ymax[n],this.xmin[n],this.xmax[n]];
            //now mirrored horizontally and rotated mathematically left twice
            case 6: return [this.xmin[n],this.xmax[n],siz-this.ymax[n],siz-this.ymin[n]];
            //now mirrored horizontally and rotated mathematically left three times
            case 7: return [siz-this.ymax[n],siz-this.ymin[n],siz-this.xmax[n],siz-this.xmin[n]];
        }

    }
    getUnshiftedParts(n,rot,x,y){
        let siz=this.parts[0].length-1;
        switch(rot){ 
            //original
            case 0: return this.parts[n][y][x];
            //rotated mathematically left once
            case 1: return this.parts[n][x][siz-y];
            //rotated mathematically left twice
            case 2: return this.parts[n][siz-y][siz-x];
            //rotated mathematically left three times
            case 3: return this.parts[n][siz-x][y];
            //now mirrored horizontally
            case 4: return this.parts[n][y][siz-x];
            //now mirrored horizontally and rotated mathematically left once
            case 5: return this.parts[n][x][y];
            //now mirrored horizontally and rotated mathematically left twice
            case 6: return this.parts[n][siz-y][x];
            //now mirrored horizontally and rotated mathematically left three times
            case 7: return this.parts[n][siz-x][siz-y];
        }
    }
    getParts(n,rot,x,y){
        let [x1,x2,y1,y2]=this.rotateBounds(rot,n);
        return this.getUnshiftedParts(n,rot,x+x1,y+y1);
    }
    getMax(n,rot){
        let [x1,x2,y1,y2]=this.rotateBounds(rot,n);
        return [x2-x1+1,y2-y1+1];
    }
    print(n,rot){
        let [xmax,ymax]=this.getMax(n,rot);
        for(let y=0;y<ymax;y++){
            let s="";
            for(let x=0;x<xmax;x++){
                s+=this.getParts(n,rot,x,y)?"#":" ";
            }
            console.log(s);
        }
    }
    getBounds(part){
      let x1=Number.MAX_SAFE_INTEGER,x2=0,y1=Number.MAX_SAFE_INTEGER,y2=0;
        for(let y=0;y<part.length;y++){
            for(let x=0;x<part[y].length;x++){
                if(part[y][x]==1){
                    if(x<x1) x1=x;
                    if(x>x2) x2=x;
                    if(y<y1) y1=y;
                    if(y>y2) y2=y;
                }
            }
        }
        return [x1,x2,y1,y2];
    }

    setOffsetsSizes(){
        for(let n=0;n<this.parts.length;n++)
            [this.xmin[n],this.xmax[n],this.ymin[n],this.ymax[n]]=this.getBounds(this.parts[n]);
    }
    optionEntry(x0, y0,rot,n) {
        let opt = [];
        opt.push(this.numToCode(n));
        let [xmax,ymax]=this.getMax(n,rot);
        if(x0+xmax>num || y0+ymax>num) return null;
        for(let y=0;y<ymax;y++){
            let s="";
            for(let x=0;x<xmax;x++){
                if(this.getParts(n,rot,x,y)==1) opt.push(String(x+x0).padStart(2, '0') + "_" + String(y+y0).padStart(2, '0'));
            }
        }
        return opt;
    }
    numToCode(n) {
        return String.fromCharCode("O".charCodeAt(0)+n)
    }
    codeToNum(c) {
        return c.charCodeAt(0)-"O".charCodeAt(0);
    }
    generateItems() {
        for (let n = 0; n < this.parts.length; ++n) {//Attention secondary items need to be added at the end also does not work with P only O
            this.dl.pushItem(this.numToCode(n),false);//false makes trouble but true also
        }
        for (let y = 0; y < num; ++y) {
            for (let x = 0; x < num; ++x) {
                this.dl.pushItem(String(x).padStart(2, '0') + "_" + String(y).padStart(2, '0'));//primary items
            }
        }
     
    }
    generateOptions() {
        for (let n = 0; n < this.parts.length; n++) {
            for (let x0 = 0; x0 < num; x0++) {
                for (let y0 = 0; y0 < num; y0++) {
                    for(let rot=0;rot<8;rot++){
                        //console.log(this.optionEntry(x0, y0,rot,n))
                        let entry=this.optionEntry(x0, y0,rot,n);
                        if(entry!==null) this.dl.setOption(entry);
                    }
                }
            }
        }
    }
    inputField(field) {
        let opt = [];
        let siz=this.parts[0].length;
        for (let x = 0; x < num; x++) {
            for (let y = 0; y < num; y++) {
                if (field[y][x] == 1) {
                    opt.push(String(x).padStart(2, '0') + "_" + String(y).padStart(2, '0'));
                }
            }
        }
        console.log("Forced Opt:"+opt)
        this.dl.setOption(opt, true);
    }
    solve() {
        return this.dl.__solve();
    }
}
let ss;
let cnt = 0;
let sol;
function solve() {
    populateField();
    ss = new PentominoSolver(parts);
    const start = performance.now();
    sol = ss.solve();
    const end = performance.now();
    console.log(`Execution time: ${end - start} ms`);
    console.log("solutions: " + sol.length)
    document.getElementById("info").innerHTML = "Solutions: " + sol.length;
    let solnr = cnt % sol.length;
    cnt++;
   // for (i = 1; i < sol[solnr].length; i++) {
        document.getElementById("info").innerHTML=JSON.stringify(sol[solnr]);

         //document.getElementById(sol[solnr][i][1] + "_" + sol[solnr][i][3]).value = sol[solnr][i][7];
    //}
}

/*
let dl = new DancingLinks();
function test(){
    while(true){
        start();
        solve()
    }
}

dl.pushItem("e");
dl.pushItem("a");
dl.pushItem("b");
dl.pushItem("c");
dl.pushItem("d");
dl.pushItem("f");
dl.pushItem("g");
dl.pushItem("h");

dl.setOption(["e"]);
dl.setOption(["c","e"]);
dl.setOption(["a","d","g"]);
dl.setOption(["b","c","f"]);
dl.setOption(["a","d","f"]);
dl.setOption(["b","g"]);
dl.setOption(["d","e","g"]);

dl.setOption(["f"]);
dl.setOption(["h"]);
dl.setOption(["h","e"]);
*/

/*
dl.pushItem("a");
dl.pushItem("b");
dl.pushItem("c");
dl.pushItem("d");
dl.pushItem("e",false);
dl.pushItem("f");
dl.pushItem("g");

dl.setOption(["c","e"]);
dl.setOption(["a","d","g"]);
dl.setOption(["b","c","f"]);
dl.setOption(["a","d","f"]);
dl.setOption(["b","g"]);
dl.setOption(["d","e","g"]);
dl.setOption(["e"]);
dl.setOption(["f"]);
*/
