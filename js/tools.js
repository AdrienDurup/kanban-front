const tools={
    checkType:(e,wantedType)=>{
        const check=e.target.classList.contains(`${wantedType.toLowerCase()}Main`);
        return check;
    },
}