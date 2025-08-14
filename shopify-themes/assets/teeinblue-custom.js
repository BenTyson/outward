setTimeout(() => {
  const elementToMove = document.querySelector('.tee-description');
  const insertAfterElement = document.querySelector('.tee-block.tee-product-price');
  if (elementToMove && insertAfterElement) {        
     insertAfterElement.before(elementToMove)
  } 
},3000)
