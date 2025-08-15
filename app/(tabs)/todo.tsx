import { ThemedText } from "@/components/ThemedText";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Touchscreen() {
  const [userInput, setUserInput] = useState("");
  const [todos, setTodos] = useState([]);

  const addTodo = () => {
    if (userInput.trim() !== "") {
      setTodos([...todos, { id: Date.now().toString(), text: userInput }]);
      setUserInput("");
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title">Todo List</ThemedText>

      <TextInput
        value={userInput}
        onChangeText={setUserInput}
        style={styles.input}
        placeholder="Type here to Todo"
        placeholderTextColor="#ccc"
      />

      <TouchableOpacity style={styles.btn} onPress={addTodo}>
        <Text style={styles.btnText}>Add To do</Text>
      </TouchableOpacity>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <Text style={styles.todoText}>{item.text}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteTodo(item.id)}
            >
              <Text style={styles.deleteText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  input: {
    height: 40,
    width: 220,
    padding: 5,
    backgroundColor: "#3285a8",
    color: "#fff",
    marginTop: 20,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: "#1f5f78",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: 220,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  todoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  todoText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  deleteBtn: {
    backgroundColor: "red",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});
