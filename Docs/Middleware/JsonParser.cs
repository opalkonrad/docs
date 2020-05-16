using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Docs.Middleware
{
    public class JsonParser
    {
        private int position;
        private int brackets;
        private bool countBrackets = true;
        private int backslashCntr;
        private StringBuilder text = new StringBuilder();
        private List<string> readyStrings = new List<string>();

        public List<string> Parse(string newBytes)
        {
            text.Append(newBytes);
            readyStrings.Clear();

            while (position < text.Length)
            {
                char currChar = text[position];

                if (currChar == '\n')
                {
                    text.Remove(position, 1);
                    continue;
                }

                if (currChar == '{' && countBrackets)
                {
                    brackets++;
                }
                else if (currChar == '}' && countBrackets)
                {
                    brackets--;
                }

                if (currChar == '\"' && backslashCntr % 2 == 0)
                {
                    countBrackets = countBrackets ? false : true;
                }

                if (currChar == '\\')
                {
                    backslashCntr++;
                }
                else
                {
                    backslashCntr = 0;
                }

                if (backslashCntr % 2 == 0 && currChar == '\\')
                {
                    countBrackets = false;
                }

                position++;

                // Create json (string) ready to send
                if (brackets == 0)
                {
                    readyStrings.Add(text.ToString(0, position));
                    text.Remove(0, position);
                    position = 0;
                    brackets = 0;
                    countBrackets = true;
                    backslashCntr = 0;
                }
            }

            return readyStrings;
        }
    }
}
