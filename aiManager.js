export class AIManager {
  constructor() {
    this.endpoint = '/api/ai_completion';
    this.messageTypes = ['long', 'short'];
    this.currentMessageType = 'long';
  }

  async getTaskSuggestions(taskData) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this task and provide optimization suggestions:
          
          interface Suggestion {
            timeOfDay: string;
            restBreaks: string[];
            productivity: string;
          }
          
          {
            "timeOfDay": "Morning (8-10 AM) would be optimal for this task",
            "restBreaks": ["Take a 5-min break every 25 mins", "15-min break after 2 hours"],
            "productivity": "This task aligns well with your high-energy morning pattern"
          }
          `,
          data: taskData
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return null;
    }
  }

  async getTaskPrediction(taskData) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this task and predict success rate:
          
          interface Prediction {
            successRate: number;
            confidence: number;
            factors: string[];
            recommendations: string[];
          }
          
          {
            "successRate": 85,
            "confidence": 90,
            "factors": [
              "Similar tasks completed successfully",
              "Optimal time scheduling",
              "Matches user productivity pattern"
            ],
            "recommendations": [
              "Schedule during morning hours",
              "Break into smaller subtasks",
              "Set reminder 30 minutes before"
            ]
          }
          `,
          data: taskData
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error getting task prediction:', error);
      return null;
    }
  }

  async analyzePatternsAndSuggestRest(taskHistory) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze work patterns and suggest optimal rest periods:
          
          interface RestSuggestion {
            suggestedBreaks: string[];
            restDuration: string;
            reasoning: string;
          }
          
          {
            "suggestedBreaks": ["2:30 PM - 3:00 PM", "5:00 PM - 5:15 PM"],
            "restDuration": "30 minutes for main break, 15 minutes for short break",
            "reasoning": "Based on your pattern of decreased productivity in mid-afternoon"
          }
          `,
          data: taskHistory
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return null;
    }
  }

  async getMotivationalMessage() {
    try {
      // Alternate between long and short messages
      this.currentMessageType = this.currentMessageType === 'long' ? 'short' : 'long';
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a ${this.currentMessageType === 'long' ? 'detailed, story-like' : 'concise but powerful'} motivational message. 
          
          For long messages:
          - Include metaphors and vivid imagery
          - Share a mini-story or scenario
          - Provide specific examples
          - Add actionable insights
          - Length should be 2-3 paragraphs
          
          For short messages:
          - Be direct and impactful
          - Use powerful language
          - Include an emoji
          - Keep it to 1-2 sentences

          Themes to choose from:
          - Personal growth and transformation
          - Overcoming adversity
          - Building momentum through small wins
          - Finding inner strength
          - Learning from challenges
          - Creating positive habits
          - Achieving excellence
          - Mindfulness and focus
          - Time management mastery
          - The power of consistency
          
          interface MotivationalMessage {
            message: string;
            theme: 'success' | 'encouragement' | 'challenge';
            icon: string;
          }
          
          Example long message:
          {
            "message": "Picture a master sculptor, standing before an uncarved block of marble. At first glance, others see only rough stone, but in the sculptor's mind, a masterpiece already exists. With each careful strike of the chisel, with patience and unwavering focus, the hidden beauty slowly emerges. Your journey is much the same - every task you complete, every small win you achieve, is like a deliberate strike of that chisel, revealing the masterpiece that is your potential.

            Just as the sculptor knows that rushing the process would risk ruining the artwork, understand that your growth and success are built through consistent, mindful actions. Some days may feel like you're merely clearing away rough edges, while others reveal stunning details of your capabilities. Remember: the sculptor's greatest tool isn't the chisel, but the vision they hold and their unwavering patience. Your vision, combined with your daily dedication, is gradually transforming possibility into reality. 🎨",
            "theme": "encouragement",
            "icon": "⚒️"
          }
          
          Example short message:
          {
            "message": "Like a lighthouse piercing through the darkest storm, your determination illuminates the path to success. Keep shining! ✨",
            "theme": "success",
            "icon": "🌟"
          }`,
          data: {}
        })
      });

      const result = await response.json();
      return {
        message: result.message + " " + result.icon,
        theme: result.theme
      };
    } catch (error) {
      console.error('Error getting motivational message:', error);
      // Enhanced fallback messages with both long and short variations
      const fallbackMessages = [
        {
          message: "Think of each task as a seed you're planting in the garden of your future. Every small action you take - completing a task, maintaining consistency, pushing through challenges - is like providing water and sunlight to these seeds. Though you may not see results immediately, beneath the surface, your dedication is nurturing roots that will soon blossom into remarkable achievements. Trust in this process of growth, for like any master gardener knows, the most beautiful gardens are built one thoughtful action at a time. 🌱",
          theme: "encouragement"
        },
        {
          message: "Your journey is like a mosaic - each completed task, no matter how small, is a beautiful piece contributing to the masterpiece of your success! ✨",
          theme: "success"
        },
        {
          message: "Imagine standing at the base of a mountain. The peak may seem distant, but every step you take, every task you complete, brings you closer to the summit. Like countless climbers before you, success isn't about making one giant leap - it's about maintaining a steady pace, finding solid footing, and keeping your eyes fixed on your goal. As you tackle each challenge, you're not just climbing higher, you're becoming stronger, more resilient, and more capable than ever before. The view from the top will be worth every step of the journey. 🏔️",
          theme: "challenge"
        },
        {
          message: "Like a star burning bright in the darkness, your persistence lights the way forward. Shine on! 🌟",
          theme: "success"
        },
        {
          message: "Consider the mighty oak that grows from a tiny acorn. Each task you complete, each challenge you overcome, is like adding another ring to your tree of success. Though some days may bring storms, and others sunshine, your consistent effort ensures steady growth. Your branches reach higher with every achievement, your roots grow deeper with every lesson learned, and your strength builds with every obstacle faced. This is how lasting success is built - not in a single season, but through patient, persistent growth through all seasons. 🌳",
          theme: "encouragement"
        },
        {
          message: "Your determination is like a compass, always pointing toward your dreams. Keep navigating forward! 🧭",
          theme: "challenge"
        },
        {
          message: "Just as a river carves its path through mountains not through force but through persistent flow, your daily dedication is reshaping the landscape of your future. Every task completed, every small victory achieved, is like a droplet contributing to this powerful flow. While each individual action might seem small, together they create an unstoppable force that can overcome any obstacle. Let your consistency be your strength, and watch as your persistent effort transforms challenges into achievements. 🌊",
          theme: "success"
        },
        {
          message: "Every step forward, no matter how small, is a victory worth celebrating. You've got this! 💫",
          theme: "encouragement"
        }
      ];
      
      // Select message based on current type
      const appropriateMessages = fallbackMessages.filter(msg => 
        this.currentMessageType === 'long' ? 
          msg.message.length > 100 : 
          msg.message.length <= 100
      );
      
      return appropriateMessages[Math.floor(Math.random() * appropriateMessages.length)];
    }
  }
}