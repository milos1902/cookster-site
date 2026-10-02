(function(){
  const panel=document.getElementById('saveTransfer');
  const status=document.getElementById('saveTransferStatus');
  const input=document.getElementById('saveTransferFile');
  const importButton=document.getElementById('saveTransferImport');
  const exportButton=document.getElementById('saveTransferExport');
  const message=text=>{status.textContent=text;};
  // Isolate menu interactions from the kitchen's drag/click controls.
  for(const name of ['pointerdown','pointerup','click','wheel']){
    panel.addEventListener(name,e=>e.stopPropagation());
  }
  exportButton.addEventListener('click',()=>{
    try{CooksterSave.exportFile();message('JSON fajl je pripremljen za preuzimanje. Sačuvaj ga pre prelaska u novi folder.');}
    catch(err){message('Izvoz nije uspeo: '+err.message);}
  });
  document.getElementById('saveTransferExportSaved').addEventListener('click',()=>{
    try{CooksterSave.exportSavedFile();message('Raniji ručni save je pripremljen za preuzimanje kao JSON.');}
    catch(err){message(err.message);}
  });
  importButton.addEventListener('click',()=>{input.value='';input.click();});
  input.addEventListener('change',async()=>{
    const file=input.files[0];if(!file)return;
    importButton.disabled=exportButton.disabled=true;
    message('Proveravam fajl…');
    try{
      if(file.size>CooksterSaveFile.MAX_BYTES)throw new Error('Fajl je prevelik (najviše 10 MB).');
      const data=CooksterSaveFile.parse(await file.text());
      const date=new Date(data.savedAt).toLocaleString('sr-Latn');
      const yes=window.confirm(`Uvesti napredak od ${date} (dan ${data.player.day})?\n\nTrenutna igra i ručni save biće zamenjeni. Prethodni ručni save ostaje u rezervnoj kopiji u ovom pregledaču. Za prenos trenutnog napretka prvo izvezi JSON.\n\nIgra će se ponovo otvoriti sa uvezenim napretkom.`);
      if(!yes){message('Uvoz je otkazan. Igra i postojeći save nisu promenjeni.');return;}
      CooksterSave.importConfirmed(data);
    }catch(err){message(err.message);}
    finally{input.value='';importButton.disabled=exportButton.disabled=false;}
  });
})();