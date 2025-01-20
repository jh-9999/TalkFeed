import Main from "./components/Main"

const App = () => {
  const username = ["kim","lee"]

  const onclick = () =>{
    alert("안녕하세요")
  } 

  return (
    <div>
      <Main user={username[2]} handleclick={onclick} />
    </div>
    
  )
};

export default App;
