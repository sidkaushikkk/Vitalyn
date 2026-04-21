import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
import os
import cv2

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "../../../public/fer2013/fer2013/fer2013.csv")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "../models/face_model.pth")
IMG_SIZE = 48
BATCH_SIZE = 64
EPOCHS = 3  # Keep it low for fast training in this environment
LEARNING_RATE = 0.001

# Emotion Mapping
EMOTIONS = {
    0: "Angry",
    1: "Disgust",
    2: "Fear",
    3: "Happy",
    4: "Sad",
    5: "Surprise",
    6: "Neutral"
}

# 1. Define Dataset
class FERDataset(Dataset):
    def __init__(self, csv_file, usage=None, limit=None):
        self.data = pd.read_csv(csv_file)
        if usage:
            self.data = self.data[self.data['Usage'] == usage]
        
        # Subsample for speed if limit is set
        if limit:
            self.data = self.data.sample(n=min(limit, len(self.data)), random_state=42)
            
        self.pixels = self.data['pixels'].tolist()
        self.labels = self.data['emotion'].tolist()

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        pixel_sequence = self.pixels[idx]
        image = np.array(pixel_sequence.split(' '), dtype='uint8').reshape(IMG_SIZE, IMG_SIZE)
        image = image / 255.0  # Normalize
        image = torch.tensor(image, dtype=torch.float32).unsqueeze(0)  # Add channel dim (1, 48, 48)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        return image, label

# 2. Define CNN Model
class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.25)
        self.fc1 = nn.Linear(64 * 12 * 12, 128)
        self.fc2 = nn.Linear(128, 7)  # 7 Emotions
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x))) # 48 -> 24
        x = self.pool(self.relu(self.conv2(x))) # 24 -> 12
        x = x.view(-1, 64 * 12 * 12)
        x = self.dropout(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 3. Training Function
def train_model():
    print(f"Loading dataset from {DATASET_PATH}...")
    
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return

    # Use a subset for training to ensure completion within reasonable time
    train_dataset = FERDataset(DATASET_PATH, usage='Training', limit=5000) 
    test_dataset = FERDataset(DATASET_PATH, usage='PrivateTest', limit=1000)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Testing samples: {len(test_dataset)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    model = SimpleCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print("Starting training...")
    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for i, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {running_loss/len(train_loader):.4f}, Accuracy: {100 * correct / total:.2f}%")

    # Save Model
    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    torch.save(model.state_dict(), MODEL_OUTPUT_PATH)
    print(f"Model saved to {MODEL_OUTPUT_PATH}")

    # Evaluate
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    print(f"Test Accuracy: {100 * correct / total:.2f}%")

if __name__ == "__main__":
    train_model()
