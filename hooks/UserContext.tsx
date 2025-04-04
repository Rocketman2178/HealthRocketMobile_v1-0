import { createContext, ReactNode, useContext, useState } from 'react';
type UserContextType = {
    user: any;
    setUser: (user: any) => void;
  };
  
const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = ()=>{
    const context = useContext(UserContext);
    if(!context){
        throw new Error("User context not found");
    }
    return context;
}
